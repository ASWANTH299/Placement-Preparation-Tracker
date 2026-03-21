const User = require('../models/User');
const PasswordResetOtpSession = require('../models/PasswordResetOtpSession');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword, validateName, validatePhoneNumber, normalizePhoneNumber } = require('../utils/validators');
const { AppError } = require('../utils/errorHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const resolveFrontendBaseUrl = () => {
  const preferred = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_PROD_URL || process.env.FRONTEND_URL)
    : (process.env.FRONTEND_URL || process.env.FRONTEND_PROD_URL);

  return (preferred || 'http://localhost:5173').replace(/\/$/, '');
};

const maskEmail = (email = '') => {
  const [localPart = '', domain = ''] = String(email).split('@');
  if (!localPart || !domain) return 'invalid-email';
  if (localPart.length <= 2) return `${localPart[0] || '*'}*@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, confirmPassword, role = 'student' } = req.body;

    // Validation
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

    if (!['student', 'admin'].includes(role)) {
      return next(new AppError('Role must be either student or admin', 400, 'VALIDATION_ERROR'));
    }

    // Check if email exists
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

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      phoneNumber: normalizedPhone || null,
      password,
      role
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

// Login
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

    // Update last login
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

// Send password reset link to email
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

    let mailDebug = null;

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = hashValue(resetToken);
      user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${resolveFrontendBaseUrl()}/reset-password?token=${resetToken}`;

      try {
        const mailResult = await sendPasswordResetEmail({
          to: user.email,
          resetUrl,
          name: user.name,
        });

        console.info('[auth.forgotPassword] Password reset email sent', {
          to: maskEmail(user.email),
          messageId: mailResult.messageId,
          accepted: mailResult.accepted,
          rejected: mailResult.rejected,
          response: mailResult.response,
          mode: mailResult.mode,
        });

        mailDebug = {
          deliveryMode: mailResult.mode,
          previewUrl: mailResult.previewUrl || null,
          fallbackResetUrl: process.env.NODE_ENV === 'production' ? null : resetUrl,
          messageId: mailResult.messageId,
        };
      } catch (mailError) {
        console.error('[auth.forgotPassword] Failed to send password reset email', {
          to: maskEmail(user.email),
          code: mailError.code,
          command: mailError.command,
          responseCode: mailError.responseCode,
          response: mailError.response,
          message: mailError.message,
        });

        const isSmtpAuthFailure = mailError?.code === 'EAUTH' || Number(mailError?.responseCode) === 535;
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const allowDevMailFallback = process.env.ALLOW_DEV_MAIL_FALLBACK === 'true';

        if (isDevelopment && allowDevMailFallback && isSmtpAuthFailure) {
          console.warn('[auth.forgotPassword] SMTP auth failed in development; returning fallback reset URL for manual testing.');
          mailDebug = {
            deliveryMode: 'dev-fallback',
            previewUrl: null,
            fallbackResetUrl: resetUrl,
            messageId: null,
          };

          return res.status(200).json({
            success: true,
            message: 'Mail provider authentication failed. Use the development reset link below, then configure Gmail App Password.',
            dev: mailDebug,
          });
        }

        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        const developmentErrorMessage = isSmtpAuthFailure
          ? 'SMTP authentication failed. Configure SMTP_USER as your Gmail address and SMTP_PASS as a 16-character Gmail App Password (not your normal Gmail password).'
          : (mailError?.message || 'Unable to send reset email. Check SMTP configuration and try again.');

        return next(
          new AppError(
            process.env.NODE_ENV === 'production'
              ? 'Unable to send reset email. Please try again later.'
              : developmentErrorMessage,
            500,
            'EMAIL_SEND_FAILED',
          ),
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
      ...(mailDebug ? { dev: mailDebug } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP and issue short-lived reset session token
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
      data: {
        resetSessionToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, resetSessionToken, email, newPassword, confirmPassword } = req.body;
    const effectiveToken = token || resetSessionToken;

    if (!effectiveToken || !newPassword || !confirmPassword) {
      return next(new AppError('Reset session token, new password, and password confirmation are required', 400, 'VALIDATION_ERROR'));
    }

    if (!validatePassword(newPassword)) {
      return next(new AppError('Password must contain at least one uppercase letter and one special character', 400, 'PASSWORD_INVALID'));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'VALIDATION_ERROR'));
    }

    let user = null;

    if (token) {
      const hashedToken = hashValue(effectiveToken);
      user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiry: { $gt: Date.now() }
      });
    } else {
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

    if (!user) {
      return next(new AppError('Reset link has expired or is invalid', 400, 'TOKEN_EXPIRED'));
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Logout
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
