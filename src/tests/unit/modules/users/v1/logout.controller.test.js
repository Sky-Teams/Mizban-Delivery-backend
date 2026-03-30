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

    req = {
      user: undefined,
      cookies: {},
    };

    res = {
      clearCookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized when req.user is missing', async () => {
    await expect(logout(req, res)).rejects.toBeInstanceOf(AppError);
    await expect(logout(req, res)).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should throw invalid credentials when refreshToken and deviceId are present (current behavior)', async () => {
    req.user = { _id: 'u1' };
    req.cookies = { refreshToken: 'rt1', deviceId: 'd1' };

    await expect(logout(req, res)).rejects.toMatchObject({
      status: 400,
      code: ERROR_CODES.INVALID_COORDINATES,
    });

    expect(logoutUser).not.toHaveBeenCalled();
  });

  it('should logout successfully when deviceId is missing but refreshToken exists (current behavior)', async () => {
    req.user = { _id: 'u1' };
    req.cookies = { refreshToken: 'rt1' };

    await logout(req, res);

    expect(logoutUser).toHaveBeenCalledWith({ refreshToken: 'rt1', deviceId: undefined });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(res.clearCookie).toHaveBeenCalledWith('deviceId');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User logout successfully',
    });
  });
});

