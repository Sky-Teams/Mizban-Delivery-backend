import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { connectDB, disconnectDB, clearDB, createFakeUserWithToken } from '../../../../config/memoryDB.js';
import app from '../../../../../app.js';

describe('POST /api/auth/logout Integration', () => {
  const logoutUrl = '/api/auth/logout';

  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    await clearDB();
  });

  it('should return 401 because route does not set req.user', async () => {
    const secret = process.env.JWT_SECRET || 'mizban-delivery-system-key';
    process.env.JWT_SECRET = secret;

    const { testUserId } = await createFakeUserWithToken();
    const token = jwt.sign({ id: testUserId }, secret, { expiresIn: '1h' });

    const res = await request(app)
      .post(logoutUrl)
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', ['refreshToken=rt1', 'deviceId=d1']);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });
});

