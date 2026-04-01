const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword, validateName } = require('../utils/validators');
const { AppError } = require('../utils/errorHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const { env } = require('../config/env');
const crypto = require('crypto');

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Resolve the client-side base URL for password reset links.
 */
const resolveClientUrl = () => {
  return env.FRONTEND_URL;
};

const maskEmail = (email = '') => {
  const [localPart = '', domain = ''] = String(email).split('@');
  if (!localPart || !domain) return 'invalid-email';
  if (localPart.length <= 2) return `${localPart[0] || '*'}*@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!validateName(name)) {
      return next(new AppError('Name must be between 2-100 characters', 400, 'VALIDATION_ERROR'));
    }

    if (!validateEmail(email)) {
      return next(new AppError('Please provide a valid email', 400, 'VALIDATION_ERROR'));
    }

    if (!validatePassword(password)) {
      return next(new AppError('Password must contain at least one uppercase letter and one special character', 400, 'PASSWORD_INVALID'));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'VALIDATION_ERROR'));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
    }

    // Role is always 'student' (schema default) — never taken from request
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Registration successful. Please login.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    console.log('[Login Flow] Login request started for email:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('[Login Flow] Missing email or password in request');
      return next(new AppError('Email and password are required', 400, 'VALIDATION_ERROR'));
    }

    console.log(`[Login Flow] Fetching user from DB: ${email.toLowerCase()}`);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.warn(`[Login Flow] User not found for email: ${email.toLowerCase()}`);
      return next(new AppError('Invalid email or password', 401, 'AUTH_FAILED'));
    }

    if (!user.password) {
      console.error(`[Login Flow] User record is severely corrupted (missing password hash) for email: ${user.email}`);
      return next(new AppError('Invalid account configuration. Please contact admin.', 500, 'SERVER_ERROR'));
    }

    console.log('[Login Flow] Comparing passwords securely via bcrypt');
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(String(password), String(user.password));

    if (!isMatch) {
      console.warn(`[Login Flow] Password mismatch for user: ${user.email}`);
      return next(new AppError('Invalid email or password', 401, 'AUTH_FAILED'));
    }

    if (!process.env.JWT_SECRET) {
      console.error('[Login Flow] CRITICAL: JWT_SECRET environment variable is missing!');
      return next(new AppError('Server configuration error', 500, 'SERVER_ERROR'));
    }

    console.log(`[Login Flow] Password match! Generating token for user ID: ${user._id}, Role: ${user.role}`);
    
    // Ensure role validation applies correctly
    if (user.role === 'admin') {
      console.log(`[Login Flow] Admin capabilities granted to user: ${user.email}`);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email, user.role);
    console.log('[Login Flow] Token generated successfully. Sending response.');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustResetPassword: Boolean(user.mustResetPassword),
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('[Login Catch Error] Unexpected error during login process:', error);
    next(new AppError('Internal server error during login', 500, 'SERVER_ERROR'));
  }
};

// ─── Forgot Password (JWT-based, 15-min expiry) ─────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400, 'VALIDATION_ERROR'));
    }

    if (!validateEmail(email)) {
      return next(new AppError('Please provide a valid email', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('name email');

    if (user) {
      // Generate a JWT reset token (15-minute expiry)
      const resetToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Store hashed token in DB for single-use validation
      user.passwordResetToken = hashValue(resetToken);
      user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${resolveClientUrl()}/reset-password?token=${resetToken}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetUrl,
          name: user.name,
        });

        console.info('[auth.forgotPassword] Reset email sent to', maskEmail(user.email));
      } catch (mailError) {
        console.error('[auth.forgotPassword] Failed to send email:', mailError.message);

        if (process.env.NODE_ENV !== 'production') {
          return res.status(200).json({
            success: true,
            message: 'Email delivery failed in development. Use the provided reset link.',
            dev: {
              reason: mailError.message,
              resetUrl,
            },
          });
        }

        // In production, clear token and return controlled error.
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Unable to send reset email. Please try again later.', 500, 'EMAIL_SEND_FAILED'));
      }
    }

    // Always return success (don't reveal whether email exists)
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password (JWT + single-use validation) ───────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(new AppError('Token, new password, and password confirmation are required', 400, 'VALIDATION_ERROR'));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400, 'VALIDATION_ERROR'));
    }

    if (!validatePassword(newPassword)) {
      return next(new AppError('Password must contain at least one uppercase letter and one special character', 400, 'PASSWORD_INVALID'));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'VALIDATION_ERROR'));
    }

    let user = null;

    // ── JWT-based email reset flow ──────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      const message = jwtError.name === 'TokenExpiredError'
        ? 'Reset link has expired. Please request a new one.'
        : 'Invalid reset link. Please request a new one.';
      return next(new AppError(message, 400, 'TOKEN_INVALID'));
    }

    // Single-use validation: compare hashed token with DB value
    const hashedToken = hashValue(token);
    user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Reset link has already been used or is invalid', 400, 'TOKEN_INVALID'));
    }

    // Update password (bcrypt hashing handled by User pre-save hook)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
