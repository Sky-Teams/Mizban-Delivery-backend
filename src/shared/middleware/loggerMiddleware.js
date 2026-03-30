import { maskSensitiveFields } from '#shared/logger/helper.log.js';
import { logger } from '#shared/logger/logger.js';
import { randomUUID } from 'crypto';

export const loggerMiddleware = (req, res, next) => {
  const auditMethods = { POST: 'Create', PUT: 'Update', DELETE: 'Delete' };
  const startDate = new Date();
  const originalUrl = req.originalUrl;
  const isAuthPath = originalUrl.includes('/api/auth');

  const originalJson = res.json.bind(res);
  res.locals.responseBody = undefined;

  res.json = (body) => {
    res.locals.responseBody = body && typeof body.toJSON === 'function' ? body.toJSON() : body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const isAuditAction = !!auditMethods[req.method];
    const userId = req.user?._id;
    const logData = {
      logId: randomUUID(),
      userId: req.user?._id ? userId : null,
      method: req.method,
      path: originalUrl,
      request: maskSensitiveFields(req.body),
      statusCode: res.statusCode,
      response:
        res.locals.responseBody?.success === true
          ? { success: true }
          : maskSensitiveFields(res.locals.responseBody),
      duration: `${new Date() - startDate}ms`,
      clientIp:
        req.ip === '::1'
          ? '127.0.0.1'
          : req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (isAuditAction) {
      const authAction = originalUrl.includes('login') ? 'Login' : 'Register';
      const action = isAuthPath ? authAction : auditMethods[req.method];
      logger.info(
        {
          ...logData,
          logType: 'AUDIT',
          userRole: req.user?.role,
          action: action,
        },
        `Audit: ${action} operation`
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

    //TODO: We can implement logger.fatal in future.
  });

  next();
};
