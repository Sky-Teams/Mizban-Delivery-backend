import { describe, it, expect, should, vi } from 'vitest';
import { getAllLogs, getLogById, getLogsStats } from '#modules/log/index.js';
import { getTopLogs, readLogs } from '#shared/logger/helper.log.js';

vi.mock('#shared/logger/helper.log.js', () => ({
  readLogs: vi.fn(),
  getTopLogs: vi.fn(),
}));

describe('Log Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Get All Logs', () => {
    it('should retrun logs by default type (audit)', async () => {
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

      readLogs.mockResolvedValue(mockLogs);

      const result = await getAllLogs(1, 10);

      expect(result).toEqual({
        count: 2,
        totalPages: 1,
        currentPage: 1,
        paginatedLogs: mockLogs,
      });
    });

    it('should return logs when type = error', async () => {
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

      readLogs.mockResolvedValue(mockLogs);

      const result = await getAllLogs(1, 10, { type: 'error' });

      expect(result).toEqual({
        count: 1,
        totalPages: 1,
        currentPage: 1,
        paginatedLogs: mockLogs,
      });
    });

    it('should return an empty array when logs does not exist', async () => {
      readLogs.mockResolvedValue([]);

      const result = await getAllLogs(1, 2);

      expect(result).toEqual({
        count: 0,
        totalPages: 0,
        currentPage: 1,
        paginatedLogs: [],
      });
    });
  });

  describe('Get Log By Id', () => {
    it('should return log by id', async () => {
      const mockLog = {
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
      };

      readLogs.mockResolvedValue(mockLog);
      const result = await getLogById('2f6f2850-6e79-4480-8fd7-281482c8891f');

      expect(result).toEqual(mockLog);
    });

    it('should return an error if log does not exist', async () => {
      readLogs.mockResolvedValue(null);

      expect(getLogById('123')).rejects.toThrow();
    });
  });

  describe('Get Log Stats', () => {
    it('should return total logs , top routes and logType', async () => {
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

      const mockTopRoutes = {
        totalLogs: 2,
        logType: 'AUDIT',
        topRoutes: {
          route: '/api/auth/login',
          count: 2,
        },
      };
      readLogs.mockResolvedValue(mockLogs);

      getTopLogs.mockResolvedValue(mockTopRoutes);

      const result = await getLogsStats();

      expect(result).toEqual(mockTopRoutes);
    });
  });
});
