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

  // Multer upload errors
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'File size must not exceed 5MB'
      : error.message || 'File upload failed';

    return res.status(400).json({
      success: false,
      error: message,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  if (error.message && (error.message.includes('Only PDF') || error.message.includes('DOCX'))) {
    return res.status(400).json({
      success: false,
      error: error.message,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Custom AppError
  if (error.statusCode) {
    return sendErrorResponse(res, error);
  }

  // Default server error
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error?.message || 'Internal server error');

  return res.status(500).json({
    success: false,
    error: message,
    errorCode: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandlerMiddleware;
