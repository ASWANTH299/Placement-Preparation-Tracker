const { sendErrorResponse } = require('../utils/errorHandler');

const errorHandlerMiddleware = (error, req, res, next) => {
  console.error('Error:', error);

  // Validation errors from Mongoose
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
      errorCode: 'DUPLICATE_ENTRY'
    });
  }

  // Cast errors
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      errorCode: 'INVALID_FORMAT'
    });
  }

  // Custom AppError
  if (error.statusCode) {
    return sendErrorResponse(res, error);
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorCode: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandlerMiddleware;
