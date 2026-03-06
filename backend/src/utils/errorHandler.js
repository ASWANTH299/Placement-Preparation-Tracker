class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_ERROR';
  const message = error.message || 'An error occurred';

  return res.status(statusCode).json({
    success: false,
    error: message,
    errorCode,
    timestamp: new Date()
  });
};

module.exports = {
  AppError,
  sendErrorResponse
};
