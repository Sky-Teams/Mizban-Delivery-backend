import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const { refreshService } = vi.hoisted(() => ({
  refreshService: vi.fn(),
}));

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  refreshService,
}));

import { refreshAccessToken } from '#modules/users/controllers/v1/auth.controller.js';

describe('refreshAccessToken controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls refreshService, sets cookie, and returns 200 with accessToken', async () => {
    const req = {
      body: {},
      cookies: { refreshToken: 'old-refresh-token', deviceId: 'device-1' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
      json: vi.fn(),
    };

    refreshService.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    await refreshAccessToken(req, res);

    expect(refreshService).toHaveBeenCalledWith({
      refreshToken: 'old-refresh-token',
      deviceId: 'device-1',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new-refresh-token',
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: 'new-access-token' },
    });
  });

  it('throws 401 when deviceId is missing', async () => {
    const req = {
      body: {},
      cookies: { refreshToken: 'old-refresh-token' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
      json: vi.fn(),
    };

    await expect(refreshAccessToken(req, res)).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });
    expect(refreshService).not.toHaveBeenCalled();
  });
});
