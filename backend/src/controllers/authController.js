const User = require('../models/User');
const PasswordResetOtpSession = require('../models/PasswordResetOtpSession');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword, validateName, validatePhoneNumber, normalizePhoneNumber } = require('../utils/validators');
const { AppError } = require('../utils/errorHandler');
const { sendPasswordResetOtpSms } = require('../utils/sms');
const crypto = require('crypto');

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const generateNumericOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
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

// Send password reset OTP to mobile
exports.forgotPassword = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return next(new AppError('Mobile number is required', 400, 'VALIDATION_ERROR'));
    }

    if (!validatePhoneNumber(mobileNumber)) {
      return next(new AppError('Please provide a valid mobile number', 400, 'VALIDATION_ERROR'));
    }

    const normalizedPhone = normalizePhoneNumber(mobileNumber);

    const otp = generateNumericOtp();
    await PasswordResetOtpSession.deleteMany({ phoneNumber: normalizedPhone });

    const otpSession = new PasswordResetOtpSession({
      phoneNumber: normalizedPhone,
      otpHash: hashValue(otp),
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verifiedTokenHash: null,
      verifiedTokenExpiry: null,
    });

    await otpSession.save();

    try {
      await sendPasswordResetOtpSms({
        to: normalizedPhone,
        otp,
      });
    } catch (smsError) {
      console.error('Failed to send password reset OTP:', smsError.message);

      await PasswordResetOtpSession.deleteMany({ phoneNumber: normalizedPhone });

      const message = `Unable to send OTP: ${smsError.message}`;

      return next(new AppError(message, 500, 'OTP_SEND_FAILED'));
    }

    const responsePayload = {
      success: true,
      message: 'If an account exists with this mobile number, an OTP has been sent',
    };

    res.status(200).json(responsePayload);
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
