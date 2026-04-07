import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { getWithAuth } from '#tests/utils/testHelpers.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const baseURL = '/api/logs/';
let token;
let testUserId;

describe('Drivers API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken('admin');
    token = result.token;
    testUserId = result.testUserId;
  });

  describe('Get All Logs', () => {
    it('should return logs', async () => {
      const res = await getWithAuth(app, baseURL, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return an error if token missing', async () => {
      const res = await getWithAuth(app, baseURL);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('Get Log By Id', () => {
    it('should return log by id', async () => {
      const fakeLogId = '9113d837-44f8-48e5-b534-7a108c0b6461';
      const res = await getWithAuth(app, `${baseURL}${fakeLogId}`, token);

      expect([200, 404]).toContain(res.status);
    });

    it('should fail for invalid uuid', async () => {
      const res = await getWithAuth(app, `${baseURL}123`, token);

      expect(res.status).toBe(400);
    });
  });

  describe('Get Log Stats', () => {
    it('should return 200 response', async () => {
      const res = await getWithAuth(app, `${baseURL}log-stats`, token);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('topRoutes');
    });
  });
});
