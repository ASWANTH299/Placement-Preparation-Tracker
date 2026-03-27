const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 10)
  || parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
  || 15 * 60 * 1000;

const max = parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS, 10)
  || 120;

const adminRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many admin requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = adminRateLimit;
