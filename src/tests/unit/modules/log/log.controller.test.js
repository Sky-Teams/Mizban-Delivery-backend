import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLog,
  getAllLogs,
  getLogs,
  getLogStats,
  getLogById,
  getLogsStats,
} from '#modules/log/index.js';

vi.mock('#modules/log/services/v1/log.service.js', () => ({
  getAllLogs: vi.fn(),
  getLogById: vi.fn(),
  getLogsStats: vi.fn(),
}));

describe('Log Controller', () => {
  let req, res;
  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('Get all Logs', () => {
    it('should retrun logs by default type (audit)', async () => {
      req.query = { page: 1, limit: 10, method: 'post' };
      const mockLogs = [
        {
          logId: '9113d837-44f8-48e5-b534-7a108c0b6460',
          level: 30,
          logType: 'AUDIT',
          method: 'POST',
          path: '/api/auth/login',
          statusCode: 200,
          userId: null,
          duration: '1316ms',
          clientIp: '127.0.0.1',
          userAgent: 'Apidog/1.0.0 (https://apidog.com)',
        },
        {
          logId: '2f6f2850-6e79-4480-8fd7-281482c8891f',
          level: 30,
          logType: 'AUDIT',
          method: 'POST',
          path: '/api/auth/login',
          statusCode: 200,
          userId: null,
          duration: '752ms',
          clientIp: '127.0.0.1',
          userAgent: 'Apidog/1.0.0 (https://apidog.com)',
        },
      ];

      getAllLogs.mockResolvedValue({
        count: 2,
        currentPage: 1,
        totalPages: 1,
        paginatedLogs: mockLogs,
      });

      await getLogs(req, res);

      expect(getAllLogs).toHaveBeenCalledWith(1, 10, {
        date: undefined,
        method: 'post',
        sort: undefined,
        type: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        currentPage: 1,
        totalPages: 1,
        data: mockLogs,
      });
    });

    it('should return logs when type = error', async () => {
      req.query = { page: 1, limit: 1, type: 'error' };
      const mockLogs = [
        {
          logId: '350ff1ac-2a2a-4225-b11f-9a41108e74fa',
          level: 50,
          logType: 'ERROR',
          method: 'GET',
          path: '/api/logs/log-stats?type=error',
          statusCode: 500,
          userId: '69cc0221a438cfdbe17090f1',
          duration: '112ms',
          clientIp: '127.0.0.1',
          userAgent: 'PostmanRuntime/7.51.1',
        },
      ];

      getAllLogs.mockResolvedValue({
        count: 1,
        totalPages: 1,
        currentPage: 1,
        paginatedLogs: mockLogs,
      });

      await getLogs(req, res);

      expect(getAllLogs).toHaveBeenCalledWith(1, 1, {
        date: undefined,
        method: undefined,
        sort: undefined,
        type: 'error',
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        totalPages: 1,
        currentPage: 1,
        data: mockLogs,
      });
    });

    it('should return an unauthorized error', async () => {
      req.user = null;

      await expect(getLogs(req, res)).rejects.toThrow();
    });
  });

  describe('Get Log By Id', () => {
    it('should return log by id', async () => {
      req.params = { logId: '2f6f2850-6e79-4480-8fd7-281482c8891f' };
      const mockLogs = [
        {
          level: 30,
          time: '2026-04-06T06:08:02.311Z',
          pid: 2096,
          hostname: 'DESKTOP-J8KD0E9',
          logId: '2f6f2850-6e79-4480-8fd7-281482c8891f',
          userId: null,
          method: 'POST',
          path: '/api/auth/login',
          request: {
            email: 'admin@gmail.com',
            password: '[REDACTED]',
          },
          statusCode: 200,
          response: {
            success: true,
          },
          duration: '752ms',
          clientIp: '127.0.0.1',
          userAgent: 'Apidog/1.0.0 (https://apidog.com)',
          logType: 'AUDIT',
          action: 'Login',
          msg: 'Audit: Login operation',
        },
      ];

      getLogById.mockResolvedValue(mockLogs);

      await getLog(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs,
      });
    });

    it('should return an error of log does not exist', async () => {
      req.params = { logId: 'log1' };
      getLogById.mockRejectedValue(new Error('Log not found'));

      await expect(getLog(req, res)).rejects.toThrow('Log not found');
    });
  });

  describe('Get Log Stats and Top Routes', () => {
    it('should return 200 response', async () => {
      req.query = { type: 'audit' };

      const mockLogs = {
        totalLogs: 3,
        logType: 'AUDIT',
        topRoutes: [
          {
            route: '/api/auth/login',
            count: 3,
          },
        ],
      };

      getLogsStats.mockResolvedValue(mockLogs);

      await getLogStats(req, res);

      expect(getLogsStats).toHaveBeenCalledWith('audit');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalLogs: 3,
        logType: 'AUDIT',
        data: {
          topRoutes: mockLogs.topRoutes,
        },
      });
    });
  });
});
