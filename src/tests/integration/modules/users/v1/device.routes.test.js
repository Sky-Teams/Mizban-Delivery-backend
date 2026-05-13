import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { postWithAuth, putWithAuth } from '#tests/utils/testHelpers.js';
import { UserModel } from '#modules/users/index.js';

const baseURL = '/api/devices';

let token;
let testUserId;

describe('Device API Integration', () => {
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

  describe('POST /device (registerDevice)', () => {
    it('should register a new device', async () => {
      const payload = {
        deviceId: 'device-1',
        fcmToken: 'token-123456789',
        platform: 'ios',
      };

      const res = await postWithAuth(app, baseURL, payload, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await UserModel.findById(testUserId);
      expect(user.devices.length).toBe(1);
      expect(user.devices[0].deviceId).toBe('device-1');
    });

    it('should update existing device if already registered', async () => {
      await postWithAuth(
        app,
        baseURL,
        { deviceId: 'device-1', fcmToken: 'old-token123456789', platform: 'ios' },
        token
      );

      await postWithAuth(
        app,
        baseURL,
        { deviceId: 'device-1', fcmToken: 'new-token123456789', platform: 'android' },
        token
      );

      const user = await UserModel.findById(testUserId);

      expect(user.devices.length).toBe(1);
      expect(user.devices[0].fcmToken).toBe('new-token123456789');
      expect(user.devices[0].platform).toBe('android');
    });

    it('should return unauthorized if no token provided', async () => {
      const res = await postWithAuth(app, baseURL, {
        deviceId: 'device-1',
        fcmToken: 'token-123456789',
        platform: 'ios',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('PUT /device/:deviceId (updateDevice)', () => {
    beforeEach(async () => {
      await postWithAuth(
        app,
        baseURL,
        { deviceId: 'device-1', fcmToken: 'token-123456789', platform: 'ios' },
        token
      );
    });

    it('should update device info', async () => {
      const res = await putWithAuth(
        app,
        `${baseURL}/device-1`,
        { fcmToken: 'updated-token', platform: 'android' },
        token
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await UserModel.findById(testUserId);
      expect(user.devices[0].fcmToken).toBe('updated-token');
      expect(user.devices[0].platform).toBe('android');
    });

    it('should update only one field (partial update)', async () => {
      await putWithAuth(app, `${baseURL}/device-1`, { fcmToken: 'partial-token' }, token);

      const user = await UserModel.findById(testUserId);

      expect(user.devices[0].fcmToken).toBe('partial-token');
      expect(user.devices[0].platform).toBe('ios');
    });

    it('should return error if device not found', async () => {
      const res = await putWithAuth(
        app,
        `${baseURL}/unknown-device`,
        { fcmToken: 'token-123456789' },
        token
      );

      expect(res.status).toBe(404);
    });

    it('should return unauthorized if no token provided', async () => {
      const res = await putWithAuth(app, `${baseURL}/device-1`, { fcmToken: 'token-123456789' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
