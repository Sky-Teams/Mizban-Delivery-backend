import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

import { logout } from '#modules/users/controllers/v1/auth.controller.js';
import { logoutUser } from '#modules/users/services/v1/auth.service.js';

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  logoutUser: vi.fn(),
}));

describe('Auth controller - logout', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = { cookies: {} };

    res = {
      clearCookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw INVALID_CREDENTIAL when cookies are missing', async () => {
    await expect(logout(req, res)).rejects.toBeInstanceOf(AppError);
  });

  it('should throw INVALID_CREDENTIAL when refreshToken or deviceId is missing', async () => {
    req.cookies = { refreshToken: 'rt1', deviceId: 'd1' };

    await expect(logout(req, res)).resolves.toBeUndefined();

    req.cookies = { deviceId: 'd1' };
    await expect(logout(req, res)).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.LOGOUT_INVALID_SESSION,
    });

    req.cookies = { refreshToken: 'rt1' };
    await expect(logout(req, res)).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.LOGOUT_INVALID_SESSION,
    });
  });

  it('should logout successfully when refreshToken and deviceId are present', async () => {
    req.cookies = { refreshToken: 'rt1', deviceId: 'd1' };

    await logout(req, res);

    expect(logoutUser).toHaveBeenCalledWith({ refreshToken: 'rt1', deviceId: 'd1' });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('deviceId', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User logout successfully',
    });
  });
});
