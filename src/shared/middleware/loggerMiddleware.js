import { logger } from '#shared/logger/logger.js';
import { randomUUID } from 'crypto';

export const loggerMiddleware = (req, res, next) => {
  const auditMethods = { POST: 'Create', PUT: 'Update', DELETE: 'Delete' };
  const startDate = new Date();
  let isSuccess;

  res.on('finish', () => {
    const isAuditAction = !!auditMethods[req.method];
    const userId = req.user?._id;
    isSuccess = res.statusCode >= 200 && res.statusCode < 300;

    const logData = {
      logId: randomUUID(),
      userId: userId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${new Date() - startDate}ms`,
      clientIp:
        req.ip === '::1'
          ? '127.0.0.1'
          : req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (isAuditAction && userId) {
      logger.info(
        {
          ...logData,
          logType: 'AUDIT',
          userRole: req.user?.role,
          action: auditMethods[req.method],
          payload: req.body,
          success: isSuccess,
        },
        `Audit: ${auditMethods[req.method]} operation`
      );
    } else {
      logger.info({ ...logData, logType: 'ACCESS' }, 'Request completed');
    }

    if (res.statusCode >= 500) {
      logger.error(
        {
          ...logData,
          logType: 'ERROR',
          errorData: res.locals.errorData || null,
        },
        'System error detected'
      );
    }
  });

  next();
};
