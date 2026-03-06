const { AppError } = require('../utils/errorHandler');

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401, 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403, 'UNAUTHORIZED'));
    }

    next();
  };
};

module.exports = roleMiddleware;
