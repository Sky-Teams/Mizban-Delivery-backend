import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';

import { DriverModel } from '#modules/drivers/models/driver.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';
import { UserModel } from '#modules/users/index.js';

const baseURL = '/api/admin/drivers/';
let token;
let testUserId;

describe('Admin Drivers API v1 Integration', () => {
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

  describe('POST /api/admin/drivers', () => {
    const validDriver = {
      name: 'Test Driver',
      email: 'driver@test.com',
      phone: '+93700111222',
      vehicleType: 'car',
      status: 'idle',
      vehicleRegistrationNumber: 'ADM-123',

      capacity: {
        maxWeightKg: 100,
        maxPackages: 5,
      },

      timeAvailability: {
        start: '08:00',
        end: '18:00',
      },
    };

    it('should create driver successfully', async () => {
      const res = await request(app)
        .post(baseURL)
        .send(validDriver)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');

      const driver = await DriverModel.findById(res.body.data._id);

      expect(driver).not.toBeNull();
      expect(driver.vehicleType).toBe('car');
    });

    it('should fail if name missing', async () => {
      const payload = { ...validDriver };
      delete payload.name;

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('name');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if email invalid', async () => {
      const payload = { ...validDriver, email: 'invalid-email' };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_EMAIL);
    });

    it('should fail if phone invalid', async () => {
      const payload = { ...validDriver, phone: '123' };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_PHONE_NUMBER);
    });

    it('should fail if vehicleType invalid', async () => {
      const payload = { ...validDriver, vehicleType: 'truck' };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('vehicleType');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if capacity missing', async () => {
      const payload = { ...validDriver };
      delete payload.capacity;

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should fail if maxWeightKg negative', async () => {
      const payload = {
        ...validDriver,
        capacity: { maxWeightKg: -5, maxPackages: 5 },
      };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE);
    });

    it('should fail if maxPackages negative', async () => {
      const payload = {
        ...validDriver,
        capacity: { maxWeightKg: 10, maxPackages: -3 },
      };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE);
    });

    it('should fail if time format invalid', async () => {
      const payload = {
        ...validDriver,
        timeAvailability: { start: '25:00', end: '18:00' },
      };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_TIME_FORMAT);
    });

    it('should fail if end time before start', async () => {
      const payload = {
        ...validDriver,
        timeAvailability: { start: '18:00', end: '08:00' },
      };

      const res = await request(app)
        .post(baseURL)
        .send(payload)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.END_TIME_MUST_BE_GREATER);
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app).post(baseURL).send(validDriver);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('GET /api/admin/drivers', () => {
    beforeEach(async () => {
      await DriverModel.create({
        user: new mongoose.Types.ObjectId(), // fake unique user id
        name: 'Test Driver 1',
        email: 'driver1@test.com',
        phone: '+93700111222',
        vehicleType: 'car',
        status: 'idle',
        vehicleRegistrationNumber: 'CAR-1',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        timeAvailability: { start: '08:00', end: '18:00' },
      });

      await DriverModel.create({
        user: new mongoose.Types.ObjectId(), // another fake unique user id
        name: 'Test Driver 2',
        email: 'driver2@test.com',
        phone: '+93700111222',
        vehicleType: 'bike',
        status: 'offline',
        vehicleRegistrationNumber: 'BIKE-1',
        capacity: { maxWeightKg: 50, maxPackages: 3 },
        timeAvailability: { start: '08:00', end: '18:00' },
      });
    });

    it('should fetch drivers', async () => {
      const res = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`${baseURL}?limit=1&page=1`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should filter by vehicleType', async () => {
      const res = await request(app)
        .get(`${baseURL}?vehicleType=bike`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].vehicleType).toBe('bike');
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app).get(baseURL);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/drivers/:id', () => {
    let driverId;

    beforeEach(async () => {
      const driver = await DriverModel.create({
        user: new mongoose.Types.ObjectId(),
        vehicleType: 'car',
        status: 'idle',
        vehicleRegistrationNumber: 'CAR-22',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        timeAvailability: { start: '08:00', end: '18:00' },
      });

      driverId = driver._id.toString();
      console.log(driverId);
    });

    it('should fetch driver by id', async () => {
      const res = await request(app)
        .get(`${baseURL}${driverId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      console.log('Body: ', res.body);
      expect(res.body.data._id).toBe(driverId);
    });

    it('should fail if id invalid', async () => {
      const res = await request(app)
        .get(`${baseURL}invalidId`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
    });

    it('should fail if driver not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`${baseURL}${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('PUT /api/admin/drivers/:id', () => {
    let driverId;
    let user;

    beforeEach(async () => {
      user = await UserModel.create({
        name: 'Test User',
        email: `test123@example.com`,
        password: 'password123',
      });

      const driver = await DriverModel.create({
        user: user._id,
        vehicleType: 'car',
        status: 'idle',
        vehicleRegistrationNumber: `ADM-${Date.now()}`, // unique
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        timeAvailability: { start: '08:00', end: '18:00' },
      });

      driverId = driver._id.toString();
    });

    it('should update driver partially', async () => {
      const res = await request(app)
        .put(`${baseURL}${driverId}`)
        .send({
          userId: user._id,
          status: 'delivering',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('delivering');
    });

    it('should update driver partially', async () => {
      const res = await request(app)
        .put(`${baseURL}${driverId}`)
        .send({
          userId: user._id,
          status: 'delivering',
          name: 'karim',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('delivering');
      expect(res.body.data.name).toBe('karim');
    });

    it('should update driver partially', async () => {
      const res = await request(app)
        .put(`${baseURL}${driverId}`)
        .send({
          userId: user._id,
          status: 'delivering',
          name: 'karim',
          email: 'test123@example.com',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('delivering');
      expect(res.body.data.name).toBe('karim');
      expect(res.body.data.email).toBe('test123@example.com');
    });

    it('should fail if id invalid', async () => {
      const res = await request(app)
        .put(`${baseURL}invalidId`)
        .send({ status: 'idle' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
    });

    it('should fail if driver not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`${baseURL}${fakeId}`)
        .send({ status: 'idle' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should fail if no fields provided', async () => {
      const res = await request(app)
        .put(`${baseURL}${driverId}`)
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app).put(`${baseURL}${driverId}`).send({ status: 'idle' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
