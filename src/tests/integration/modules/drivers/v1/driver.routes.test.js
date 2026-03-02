import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js'; // we use relative path,because #root is not working for importing from root
// import app from '#root/app.js'; // TODO: #root is not working for importing from root of project.
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { DriverModel } from '#modules/drivers/models/driver.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

let token;
let testUserId;

describe('Drivers API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken();
    testUserId = result.testUserId;
    token = result.token;
  });

  describe('POST /api/v1/drivers', () => {
    it('should create a new driver successfully', async () => {
      const driverData = {
        vehicleType: 'car',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.vehicleType).toBe('car');

      // Verify in DB
      const driverInDB = await DriverModel.findById(res.body.data._id);
      expect(driverInDB).not.toBeNull();
      expect(driverInDB.capacity.maxWeightKg).toBe(100);
      expect(driverInDB.user.toString()).toBe(testUserId.toString());
    });

    it('should create a new driver successfully', async () => {
      const driverData = {
        vehicleType: 'bike',
        status: 'offline',
        capacity: { maxWeightKg: '100', maxPackages: '5' },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.vehicleType).toBe('bike');

      // Verify in DB
      const driverInDB = await DriverModel.findById(res.body.data._id);
      expect(driverInDB).not.toBeNull();
      expect(driverInDB.capacity.maxWeightKg).toBe(100);
      expect(driverInDB.user.toString()).toBe(testUserId.toString());
    });

    it('should fail if required field is missing (vehicleType)', async () => {
      const driverData = {
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('vehicleType');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if required field is missing (capacity)', async () => {
      const driverData = {
        status: 'idle',
        vehicleType: 'car',
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('capacity');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if maxWeightKg is negative', async () => {
      const driverData = {
        status: 'idle',
        vehicleType: 'car',
        capacity: { maxWeightKg: -1, maxPackages: -10 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('capacity.maxWeightKg');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE);
    });

    it('should fail if maxPackages is negative', async () => {
      const driverData = {
        status: 'idle',
        vehicleType: 'car',
        capacity: { maxWeightKg: 11, maxPackages: -10 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('capacity.maxPackages');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE);
    });

    it('should fail if maxPackages is not a number', async () => {
      const driverData = {
        status: 'idle',
        vehicleType: 'car',
        capacity: { maxWeightKg: 11, maxPackages: '123mahdi' },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('capacity.maxPackages');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER);
    });

    it('should fail if maxWeightKg is not a number', async () => {
      const driverData = {
        status: 'idle',
        vehicleType: 'car',
        capacity: { maxWeightKg: 'mahdi', maxPackages: 123 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('capacity.maxWeightKg');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER);
    });

    it('should not allow creating duplicate driver for same user', async () => {
      await DriverModel.create({
        user: testUserId,
        vehicleType: 'car',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      });

      const driverData = {
        vehicleType: 'car',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      };

      const res = await request(app)
        .post('/api/v1/drivers')
        .send(driverData)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.DRIVER_ALREADY_EXIST);
      expect(res.body.message).toMatch('Driver already exist');
    });
  });
});
