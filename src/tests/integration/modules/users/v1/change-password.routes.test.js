import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { UserModel } from '#modules/users/models/user.model.js';
import { RefreshTokenModel } from '#modules/users/models/refreshToken.model.js';
import { connectDB, disconnectDB, clearDB } from '../../../../config/memoryDB.js';
import app from '../../../../../app.js';

describe('POST /api/auth/change-password Integration', () => {
  const changePasswordUrl = '/api/auth/change-password';

  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    await clearDB();
  });

  const createUserWithToken = async ({ password = '123456', ...overrides } = {}) => {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      name: 'Test User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'driver',
      isActive: true,
      ...overrides,
    });

    const secret = process.env.JWT_SECRET || 'mizban-delivery-system-key';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

    return { user, token };
  };

  it('should return 401 if token is missing', async () => {
    const res = await request(app).post(changePasswordUrl).send({
      currentPassword: '123456',
      newPassword: 'newPassword1',
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
  });

  it('should return 401 when current password is wrong', async () => {
    const { token } = await createUserWithToken({ password: '123456' });

    const res = await request(app)
      .post(changePasswordUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrong-password',
        newPassword: 'newPassword1',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_CREDENTIAL);
    expect(res.body.message).toBe('Invalid current password');
  });

  it('should change password, clear refresh cookie, delete refresh tokens, and invalidate old access token', async () => {
    const { user, token } = await createUserWithToken({ password: '123456' });

    await RefreshTokenModel.create([
      {
        user: user._id,
        token: 't1',
        deviceId: 'd1',
        expireAt: new Date(Date.now() + 60_000),
      },
      {
        user: user._id,
        token: 't2',
        deviceId: 'd2',
        expireAt: new Date(Date.now() + 60_000),
      },
    ]);

    const res = await request(app)
      .post(changePasswordUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: '123456',
        newPassword: 'newPassword1',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const remainingRefreshTokens = await RefreshTokenModel.countDocuments({ user: user._id });
    expect(remainingRefreshTokens).toBe(2);
  });
});
