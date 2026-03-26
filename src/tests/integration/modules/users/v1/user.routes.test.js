import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const baseURL = '/api/user';
let token;
let testUserId;

describe('User API Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken();
    testUserId = result.testUserId;
    token = result.token;
  });

  describe('getProfile', () => {
    it('Should return user info', async () => {
      const res = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
    });

    it('Should throw unauthorized error if user is missing', async () => {
      const res = await request(app).get(baseURL);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
