import request from 'supertest';
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { UserModel } from '#modules/users/models/user.model.js';
import { connectDB, disconnectDB, clearDB } from '../../../../config/memoryDB.js';
import app from '../../../../../app.js';

describe('POST /api/auth/login Integration', () => {
  const loginUrl = '/api/auth/login';

  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    await clearDB();
  });

  const createUser = async ({ password = '123456', ...overrides } = {}) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    return UserModel.create({
      name: 'Test User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'driver',
      isActive: true,
      ...overrides,
    });
  };

  it('should fail for invalid email format', async () => {
    const res = await request(app).post(loginUrl).send({
      email: 'invalid-email',
      password: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_EMAIL_FORMAT);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.field).toBe('email');
  });

  it('should fail when user does not exist', async () => {
    const res = await request(app).post(loginUrl).send({
      email: 'nouser@example.com',
      password: '123456',
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_CREDENTIAL);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should fail when password is wrong', async () => {
    await createUser({ email: 'user@example.com', password: '123456' });

    const res = await request(app).post(loginUrl).send({
      email: 'user@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_CREDENTIAL);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should fail when account is disabled', async () => {
    await createUser({
      email: 'disabled@example.com',
      password: '123456',
      isActive: false,
    });

    const res = await request(app).post(loginUrl).send({
      email: 'disabled@example.com',
      password: '123456',
    });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe(ERROR_CODES.ACCOUNT_DISABLED);
    expect(res.body.message).toBe('Account is disabled!');
  });

  it('should login successfully with valid credentials', async () => {
    const user = await createUser({
      email: 'valid@example.com',
      password: '123456',
      role: 'driver',
    });

    const res = await request(app).post(loginUrl).send({
      email: 'valid@example.com',
      password: '123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: user._id.toString(),
      email: 'valid@example.com',
      role: 'driver',
      token: expect.any(String),
    });

    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);
    expect(setCookie.some((cookie) => cookie.startsWith('deviceId='))).toBe(true);
  });
});
