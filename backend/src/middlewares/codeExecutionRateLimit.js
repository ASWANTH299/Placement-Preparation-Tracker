const rateLimit = require('express-rate-limit');

const codeExecutionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 runs/submissions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Code execution rate limit exceeded. Please wait a moment before running or submitting again.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = codeExecutionRateLimit;
