import { logger } from '#shared/utils/logger.js';

export const logMiddleware = (req, res, next) => {
  if (req.originalUrl.startsWith('/api/logs')) {
    return next();
  }
};
