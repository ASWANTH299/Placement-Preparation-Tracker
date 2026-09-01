const rateLimit = require('express-rate-limit');

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 password reset requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again in 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  authRateLimit,
  passwordResetRateLimit
};
