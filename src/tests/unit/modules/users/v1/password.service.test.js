import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import {
  forgotPasswordService,
  resetPasswordService,
} from '#modules/users/services/v1/auth.service.js';
import { agenda } from '#root/src/config/agenda.js';
import { UserModel } from '#modules/users/models/user.model.js';
import { RefreshTokenModel } from '#modules/users/models/refreshToken.model.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('#root/src/config/agenda.js', () => ({
  agenda: {
    now: vi.fn(),
  },
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    findOne: vi.fn(),
  },
}));

vi.mock('#modules/users/models/refreshToken.model.js', () => ({
  RefreshTokenModel: {
    deleteMany: vi.fn(),
  },
}));

describe('Password Services (forgot/reset)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESET_PASSWORD_URL_BASE;
    process.env.FRONTEND_URL = 'http://example.com';
  });

  describe('forgotPasswordService', () => {
    it('should set reset token and enqueue reset email job', async () => {
      const fakeUser = {
        _id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        createPasswordResetToken: vi.fn(() => 'reset-token'),
        save: vi.fn().mockResolvedValue(true),
      };

      UserModel.findOne.mockResolvedValue(fakeUser);
      agenda.now.mockResolvedValue(true);

      const { resetUrl } = await forgotPasswordService({ email: fakeUser.email });

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: fakeUser.email });
      expect(fakeUser.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(fakeUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

      expect(agenda.now).toHaveBeenCalledWith('send-reset-password-email', {
        email: fakeUser.email,
        username: fakeUser.name,
        resetUrl: expect.stringContaining('/reset-password/reset-token'),
      });

      expect(resetUrl).toBe('http://example.com/reset-password/reset-token');
    });

    it('should use legacy RESET_PASSWORD_URL_BASE when provided', async () => {
      process.env.RESET_PASSWORD_URL_BASE = 'http://legacy.example.com/api/auth/reset-password/';

      const fakeUser = {
        _id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        createPasswordResetToken: vi.fn(() => 'reset-token'),
        save: vi.fn().mockResolvedValue(true),
      };

      UserModel.findOne.mockResolvedValue(fakeUser);
      agenda.now.mockResolvedValue(true);

      const { resetUrl } = await forgotPasswordService({ email: fakeUser.email });

      expect(resetUrl).toBe('http://legacy.example.com/api/auth/reset-password/reset-token');
      expect(agenda.now).toHaveBeenCalledWith(
        'send-reset-password-email',
        expect.objectContaining({ resetUrl })
      );
    });

    it('should throw INVALID_CREDENTIAL when email does not exist', async () => {
      UserModel.findOne.mockResolvedValue(null);

      await expect(forgotPasswordService({ email: 'missing@example.com' })).rejects.toMatchObject({
        status: 401,
        code: ERROR_CODES.INVALID_CREDENTIAL,
        isOperational: true,
      });
    });
  });

  describe('resetPasswordService', () => {
    it('should throw INVALID_TOKEN for invalid or expired reset token', async () => {
      UserModel.findOne.mockResolvedValue(null);

      await expect(
        resetPasswordService({
          resetToken: 'bad-token',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123',
        })
      ).rejects.toMatchObject({
        status: 400,
        code: ERROR_CODES.INVALID_TOKEN,
        isOperational: true,
      });
    });

    it('should throw PASSWORD_NOT_MATCHING when passwords do not match', async () => {
      const fakeUser = {
        _id: 'user-id',
        set: vi.fn(),
        save: vi.fn(),
      };

      UserModel.findOne.mockResolvedValue(fakeUser);

      await expect(
        resetPasswordService({
          resetToken: 'valid-token',
          newPassword: 'newpass123',
          confirmPassword: 'different123',
        })
      ).rejects.toThrow(AppError);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(fakeUser.save).not.toHaveBeenCalled();
      expect(RefreshTokenModel.deleteMany).not.toHaveBeenCalled();
    });

    it('should hash password, clear reset fields, and delete refresh tokens', async () => {
      const fakeUser = {
        _id: 'user-id',
        set: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
      };

      UserModel.findOne.mockResolvedValue(fakeUser);
      bcrypt.hash.mockResolvedValue('hashed-new-password');
      RefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await resetPasswordService({
        resetToken: 'valid-token',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
      expect(fakeUser.set).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-new-password',
          passwordResetToken: null,
          passwordResetExpires: null,
          changedPasswordAt: expect.any(Date),
        })
      );
      expect(fakeUser.save).toHaveBeenCalledTimes(1);
      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({ user: fakeUser._id });
    });
  });
});
