import { ERROR_CODES } from '../errors/customCodes.js';
import { AppError } from '../errors/error.js';

// Use this for just check user role
export const authorizeRole = (...allowedRoles) => {
  return authorize({ roles: allowedRoles });
};

// Use this when check user + service
export const authorize = ({ roles = [], services = [] }) => {
  return (req, res, next) => {
    if (req.service) {
      if (services.includes(req.service.name)) return next();

      return next(
        new AppError(
          "Forbidden: You don't have permission to access this resource",
          403,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    if (!req.user || !roles.includes(req.user.role))
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
