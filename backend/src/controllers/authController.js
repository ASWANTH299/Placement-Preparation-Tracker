const User = require('../models/User');
const PasswordResetOtpSession = require('../models/PasswordResetOtpSession');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword, validateName, validatePhoneNumber, normalizePhoneNumber } = require('../utils/validators');
const { AppError } = require('../utils/errorHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Resolve the client-side base URL for password reset links.
 * Priority: CLIENT_URL → FRONTEND_URL → FRONTEND_PROD_URL → fallback
 */
const resolveClientUrl = () => {
  const url =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_PROD_URL ||
    'http://localhost:3000';
  return url.replace(/\/$/, '');
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
    const { name, email, phoneNumber, password, confirmPassword } = req.body;

    if (!validateName(name)) {
      return next(new AppError('Name must be between 2-100 characters', 400, 'VALIDATION_ERROR'));
    }

    if (!validateEmail(email)) {
      return next(new AppError('Please provide a valid email', 400, 'VALIDATION_ERROR'));
    }

    const hasPhone = Boolean(phoneNumber);
    const normalizedPhone = hasPhone ? normalizePhoneNumber(phoneNumber) : null;

    if (hasPhone && !validatePhoneNumber(phoneNumber)) {
      return next(new AppError('Please provide a valid phone number', 400, 'VALIDATION_ERROR'));
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

    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
      if (existingPhone) {
        return next(new AppError('Phone number already exists', 409, 'PHONE_EXISTS'));
      }
    }

    // Role is always 'student' (schema default) — never taken from request
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      phoneNumber: normalizedPhone || null,
      password,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400, 'VALIDATION_ERROR'));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401, 'AUTH_FAILED'));
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email, user.role);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
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

        // Clear the token since email failed
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
          new AppError(
            process.env.NODE_ENV === 'production'
              ? 'Unable to send reset email. Please try again later.'
              : `Email send failed: ${mailError.message}`,
            500,
            'EMAIL_SEND_FAILED'
          )
        );
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

// ─── Verify Reset OTP (mobile flow — unchanged) ─────────────────────────────
exports.verifyResetOtp = async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return next(new AppError('Mobile number and OTP are required', 400, 'VALIDATION_ERROR'));
    }

    if (!validatePhoneNumber(mobileNumber)) {
      return next(new AppError('Please provide a valid mobile number', 400, 'VALIDATION_ERROR'));
    }

    const normalizedPhone = normalizePhoneNumber(mobileNumber);
    const otpSession = await PasswordResetOtpSession.findOne({ phoneNumber: normalizedPhone })
      .select('+otpHash +otpExpiry +attempts +verifiedTokenHash +verifiedTokenExpiry');

    if (!otpSession || !otpSession.otpHash || !otpSession.otpExpiry || otpSession.otpExpiry <= Date.now()) {
      return next(new AppError('OTP is invalid or expired', 400, 'OTP_INVALID'));
    }

    const otpHash = hashValue(String(otp));

    if (otpSession.otpHash !== otpHash) {
      otpSession.attempts = (otpSession.attempts || 0) + 1;
      if (otpSession.attempts >= 5) {
        await PasswordResetOtpSession.deleteOne({ _id: otpSession._id });
      } else {
        await otpSession.save({ validateBeforeSave: false });
      }
      return next(new AppError('OTP is incorrect', 400, 'OTP_INVALID'));
    }

    const resetSessionToken = crypto.randomBytes(32).toString('hex');
    otpSession.verifiedTokenHash = hashValue(resetSessionToken);
    otpSession.verifiedTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    otpSession.otpHash = null;
    otpSession.otpExpiry = null;
    otpSession.attempts = 0;
    await otpSession.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: { resetSessionToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password (JWT + single-use validation) ───────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, resetSessionToken, email, newPassword, confirmPassword } = req.body;
    const effectiveToken = token || resetSessionToken;

    if (!effectiveToken || !newPassword || !confirmPassword) {
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

    if (token) {
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
    } else {
      // ── OTP-based mobile reset flow (unchanged) ─────────────────────────
      if (!email || !validateEmail(email)) {
        return next(new AppError('Valid account email is required to reset password', 400, 'VALIDATION_ERROR'));
      }

      const otpSession = await PasswordResetOtpSession.findOne({
        verifiedTokenHash: hashValue(effectiveToken),
        verifiedTokenExpiry: { $gt: Date.now() },
      }).select('+verifiedTokenHash +verifiedTokenExpiry');

      if (!otpSession) {
        return next(new AppError('Reset session has expired or is invalid', 400, 'TOKEN_EXPIRED'));
      }

      user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return next(new AppError('No account found with this email', 404, 'NOT_FOUND'));
      }

      await PasswordResetOtpSession.deleteOne({ _id: otpSession._id });
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
