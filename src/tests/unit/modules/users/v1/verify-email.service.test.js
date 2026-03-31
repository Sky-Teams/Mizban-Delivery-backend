import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { hashToken } from '#shared/utils/jwt.js';

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    findOne: vi.fn(),
  },
}));

const { verifyUserEmail } = await import('#modules/users/services/v1/auth.service.js');
const { UserModel } = await import('#modules/users/models/user.model.js');

describe('verifyUserEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks user as verified and clears verification fields', async () => {
    const fakeUser = {
      set: vi.fn(),
      save: vi.fn().mockResolvedValue(true),
    };

    UserModel.findOne.mockResolvedValue(fakeUser);

    await verifyUserEmail('verify-token');

    expect(UserModel.findOne).toHaveBeenCalledWith({
      emailVerificationToken: hashToken('verify-token'),
      emailVerificationExpires: { $gt: expect.any(Date) },
    });

    expect(fakeUser.set).toHaveBeenCalledWith({
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    expect(fakeUser.save).toHaveBeenCalledTimes(1);
  });

  it('throws INVALID_TOKEN when token is invalid/expired', async () => {
    UserModel.findOne.mockResolvedValue(null);

    await expect(verifyUserEmail('bad-token')).rejects.toMatchObject({
      status: 400,
      code: ERROR_CODES.INVALID_TOKEN,
      isOperational: true,
    });
  });
});
