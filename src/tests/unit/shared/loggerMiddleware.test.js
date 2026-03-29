import { logger } from '#shared/logger/logger.js';
import { loggerMiddleware } from '#shared/middleware/loggerMiddleware.js';
import { describe, it, expect, beforeEach } from 'vitest';

vi.mock('#shared/logger/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('loggerMiddleware', () => {
  let req, res, next;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      method: 'POST',
      originalUrl: '/test-path',
      headers: { 'user-agent': 'vitest' },
      body: { key: 'value' },
      user: { _id: '1', role: 'admin' },
      ip: '127.0.0.1',
    };
    res = {
      statusCode: 200,
      json :  vi.fn().mockReturnThis(),
      locals: {},
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          res.finishCallback = callback;
        }
      }),
    };
    next = vi.fn();
  });

  it('should log AUDIT for POST requests', async () => {
    loggerMiddleware(req, res, next);
    res.finishCallback();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        logType: 'AUDIT',
        action: 'Create',
        request: { key: 'value' },
      }),
      expect.stringContaining('Audit:')
    );
  });

  it('Should log ACCESS for GET requests', async () => {
    req.method = 'GET';

    loggerMiddleware(req, res, next);
    res.finishCallback();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        logType: 'ACCESS',
        method: 'GET',
        statusCode: res.statusCode,
      }),
      expect.stringContaining('Request completed')
    );
  });

  it('Should log ERROR for server error', async () => {
    res.statusCode = 500;
    res.locals.errorData = { message: 'DB connection failed' };

    loggerMiddleware(req, res, next);
    res.finishCallback();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        logType: 'ERROR',
        errorData: res.locals.errorData,
      }),
      expect.stringContaining('System error detected')
    );
  });
});
