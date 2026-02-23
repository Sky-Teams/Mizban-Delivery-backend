import { ERROR_CODES } from '../errors/customCodes.js';
import { AppError, unauthorized } from '../errors/error.js';

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) return next(unauthorized());

    if (!allowedRoles.includes(user.role))
      return next(
        new AppError(
          "Forbidden: You don't have permission to access this resource",
          403,
          ERROR_CODES.FORBIDDEN
        )
      );

    next();
  };
};
