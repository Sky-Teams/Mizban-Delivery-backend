import request from 'supertest';
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectDB, disconnectDB, clearDB } from '../../../../config/memoryDB.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { hashToken } from '#shared/utils/jwt.js';
import { UserModel } from '#modules/users/models/user.model.js';
import { RefreshTokenModel } from '#modules/users/models/refreshToken.model.js';
import { agenda } from '#root/src/config/agenda.js';

vi.mock('#root/src/config/agenda.js', () => ({
  agenda: {
    now: vi.fn(),
  },
}));

describe('Forgot/Reset Password Integration', () => {
  let app;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'http://example.com';
    app = (await import('../../../../../app.js')).default;
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDB();
  });

  describe('POST /api/auth/forgot-password', () => {
    const url = '/api/auth/forgot-password';

    it('should fail for invalid email format', async () => {
      const res = await request(app).post(url).send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_EMAIL);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('email');
    });

    it('should set reset fields and enqueue a job', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await UserModel.create({
        name: 'Test User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'customer',
        isActive: true,
      });

      const res = await request(app).post(url).send({ email: 'user@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Email sent');

      expect(agenda.now).toHaveBeenCalledTimes(1);
      expect(agenda.now.mock.calls[0][0]).toBe('send-reset-password-email');

      const jobData = agenda.now.mock.calls[0][1];
      expect(jobData).toMatchObject({
        email: 'user@example.com',
        username: 'Test User',
        resetUrl: expect.any(String),
      });
      expect(jobData.resetUrl).toContain('/reset-password/');

      const token = jobData.resetUrl.split('/').pop();
      expect(token).toMatch(/^[a-f0-9]{64}$/i);

      const updatedUser = await UserModel.findOne({ email: 'user@example.com' });
      expect(updatedUser.passwordResetToken).toMatch(/^[a-f0-9]{64}$/i);
      expect(updatedUser.passwordResetToken).toBe(hashToken(token));
      expect(updatedUser.passwordResetExpires).toBeInstanceOf(Date);
      expect(updatedUser.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/reset-password/:resetToken', () => {
    it('should fail for invalid token format', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/not-a-valid-token')
        .send({ newPassword: 'newpass123', confirmPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_TOKEN);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('resetToken');
    });

    it('should fail when passwords do not match (validator)', async () => {
      const token64 = 'a'.repeat(64);
      const res = await request(app)
        .post(`/api/auth/reset-password/${token64}`)
        .send({ newPassword: 'newpass123', confirmPassword: 'different123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PASSWORD_NOT_MATCHING);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('confirmPassword');
    });

    it('should reset password and clear refresh tokens', async () => {
      const oldHashedPassword = await bcrypt.hash('oldpass123', 10);
      const user = await UserModel.create({
        name: 'Reset User',
        email: 'reset@example.com',
        password: oldHashedPassword,
        role: 'customer',
        isActive: true,
      });

      const resetToken = user.createToken();
      await user.save({ validateBeforeSave: false });

      await RefreshTokenModel.create({
        user: user._id,
        token: 'refresh-token-hash',
        deviceId: 'device-1',
        expireAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'newpass123', confirmPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password updated successfully');

      const updatedUser = await UserModel.findById(user._id);
      expect(updatedUser.password).not.toBe(oldHashedPassword);
      expect(updatedUser.passwordResetToken).toBeNull();
      expect(updatedUser.passwordResetExpires).toBeNull();
      expect(updatedUser.changedPasswordAt).toBeInstanceOf(Date);

      const remainingTokens = await RefreshTokenModel.countDocuments({ user: user._id });
      expect(remainingTokens).toBe(0);
    });

    it('should fail when reset token is expired', async () => {
      const oldHashedPassword = await bcrypt.hash('oldpass123', 10);
      const user = await UserModel.create({
        name: 'Expired User',
        email: 'expired@example.com',
        password: oldHashedPassword,
        role: 'customer',
        isActive: true,
      });

      const resetToken = user.createToken();
      user.passwordResetExpires = new Date(Date.now() - 1000);
      await user.save({ validateBeforeSave: false });

      const res = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'newpass123', confirmPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_TOKEN);
      expect(res.body.message).toBe('Invalid or expired token');
    });
  });
});
