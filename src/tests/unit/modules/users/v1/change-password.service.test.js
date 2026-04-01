import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const { findById, deleteMany, compare, hash } = vi.hoisted(() => ({
  findById: vi.fn(),
  deleteMany: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: { findById },
}));

vi.mock('#modules/users/models/refreshToken.model.js', () => ({
  RefreshTokenModel: { deleteMany },
}));

vi.mock('bcryptjs', () => ({
  default: { compare, hash },
}));

import { changePasswordService } from '#modules/users/services/v1/auth.service.js';

describe('changePasswordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when userId is missing', async () => {
    findById.mockResolvedValue(null);

    await expect(
      changePasswordService('', {
        currentPassword: 'old',
        newPassword: 'newPassword1',
      })
    ).rejects.toMatchObject({
      status: 404,
      code: ERROR_CODES.NOT_FOUND,
    });

    expect(compare).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      changePasswordService('u1', {
        currentPassword: 'old',
        newPassword: 'newPassword1',
      })
    ).rejects.toMatchObject({
      status: 404,
      code: ERROR_CODES.NOT_FOUND,
    });

    expect(compare).not.toHaveBeenCalled();
  });

  it('throws INVALID_CREDENTIAL when current password is wrong', async () => {
    findById.mockResolvedValue({ _id: 'u1', password: 'hash', save: vi.fn() });
    compare.mockResolvedValue(false);

    await expect(
      changePasswordService('u1', {
        currentPassword: 'wrong',
        newPassword: 'newPassword1',
      })
    ).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });
  });

  it('hashes new password, sets changedPasswordAt, saves user, and deletes refresh tokens', async () => {
    const save = vi.fn().mockResolvedValue({});
    const user = { _id: 'u1', password: 'old-hash', save, changedPasswordAt: null };
    findById.mockResolvedValue(user);
    compare.mockResolvedValue(true);
    hash.mockResolvedValue('new-hash');
    deleteMany.mockResolvedValue({ deletedCount: 2 });

    await changePasswordService('u1', {
      currentPassword: 'old',
      newPassword: 'newPassword1',
    });

    expect(hash).toHaveBeenCalledWith('newPassword1', 12);
    expect(user.password).toBe('new-hash');
    expect(user.changedPasswordAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledWith({ user: 'u1' });
  });
});
