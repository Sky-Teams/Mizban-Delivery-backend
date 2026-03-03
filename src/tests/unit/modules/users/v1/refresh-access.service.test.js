import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const {
  findOne,
  findOneAndUpdate,
  findById,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = vi.hoisted(() => ({
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  findById: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashToken: vi.fn(),
}));

vi.mock('#modules/users/models/refreshToken.model.js', () => ({
  RefreshTokenModel: { findOne, findOneAndUpdate },
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: { findById },
}));

vi.mock('#shared/utils/jwt.js', () => ({
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRES_TIME: 7 * 24 * 60 * 60 * 1000,
}));

import { refreshService } from '#modules/users/services/v1/auth.service.js';

describe('refreshService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashToken.mockReturnValue('hashed-token');
  });

  it('throw 401 when refreshToken or deviceId is missing', async () => {
    await expect(refreshService({ refreshToken: '', deviceId: 'ddddd' })).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });

    await expect(refreshService({ refreshToken: 'dddddddd', deviceId: '' })).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });
  });

  it('throws 401 when token is not found', async () => {
    findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });

    await expect(refreshService({ refreshToken: 't1', deviceId: 'd1' })).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });
  });

  it('throws 401 and deletes token when token is expired', async () => {
    const deleteOne = vi.fn().mockResolvedValue({});
    findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'rt1',
        user: { _id: 'u1' },
        expireAt: new Date(Date.now() - 1000),
        deleteOne,
      }),
    });

    await expect(refreshService({ refreshToken: 't1', deviceId: 'd1' })).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });

    expect(deleteOne).toHaveBeenCalled();
  });

  it('throws 401 when user is not found', async () => {
    findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'rt1',
        user: { _id: 'u1' },
        expireAt: new Date(Date.now() + 60_000),
      }),
    });
    findById.mockResolvedValue(null);

    await expect(refreshService({ refreshToken: 't1', deviceId: 'd1' })).rejects.toMatchObject({
      status: 401,
    });
  });

  it('throws 403 when user is disabled', async () => {
    findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'rt1',
        user: { _id: 'u1' },
        expireAt: new Date(Date.now() + 60_000),
      }),
    });
    findById.mockResolvedValue({
      _id: 'u1',
      email: 'user@example.com',
      isActive: false,
    });

    await expect(refreshService({ refreshToken: 't1', deviceId: 'd1' })).rejects.toMatchObject({
      status: 403,
      code: ERROR_CODES.ACCOUNT_DISABLED,
    });
  });

  it('rotates token and returns new access + refresh tokens', async () => {
    findOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'rt1',
        user: { _id: 'u1' },
        expireAt: new Date(Date.now() + 60_000),
      }),
    });

    findById.mockResolvedValue({
      _id: 'u1',
      email: 'user@example.com',
      role: 'customer',
      isActive: true,
    });

    generateRefreshToken.mockReturnValue('new-refresh');
    hashToken.mockReturnValue('new-refresh-hash');
    generateAccessToken.mockReturnValue('new-access');
    findOneAndUpdate.mockResolvedValue({});

    const result = await refreshService({ refreshToken: 'old-refresh', deviceId: 'd1' });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'rt1' },
      expect.objectContaining({
        token: 'new-refresh-hash',
      }),
      expect.any(Object)
    );

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });
});
