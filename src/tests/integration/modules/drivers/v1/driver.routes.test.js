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

const baseURL = '/api/drivers/';
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

  describe('POST /api/drivers', () => {
    const validDriver = {
      name: 'Test Driver',
      email: 'driver@test.com',
      phone: '+93700111222',
      vehicleType: 'motorbike',
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
      expect(driver.vehicleType).toBe('motorbike');
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

  describe('GET /api/drivers', () => {
    beforeEach(async () => {
      await DriverModel.create({
        user: new mongoose.Types.ObjectId(), // fake unique user id
        name: 'Test Driver 1',
        email: 'driver1@test.com',
        phone: '+93700111222',
        vehicleType: 'motorbike',
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
        vehicleType: 'motorbike',
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
        .get(`${baseURL}?vehicleType=motorbike`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].vehicleType).toBe('motorbike');
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app).get(baseURL);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/drivers/:id', () => {
    let driverId;

    beforeEach(async () => {
      const driver = await DriverModel.create({
        user: new mongoose.Types.ObjectId(),
        vehicleType: 'motorbike',
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

  describe('PUT /api/drivers/:id', () => {
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
        vehicleType: 'motorbike',
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

// We don't need these tests.(For User)
// describe('Drivers API v1 Integration', () => {
//   beforeAll(async () => {
//     await connectDB();
//   }, 30000);

//   afterAll(async () => {
//     await disconnectDB();
//   }, 30000);

//   beforeEach(async () => {
//     await clearDB();
//     const result = await createFakeUserWithToken();
//     testUserId = result.testUserId;
//     token = result.token;
//   });

//   describe('POST /api/drivers', () => {
//     it('should create a new driver successfully', async () => {
//       const driverData = {
//         vehicleType: 'car',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         vehicleRegistrationNumber: 'ABC-1234',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(201);
//       expect(res.body.success).toBe(true);
//       expect(res.body.data).toHaveProperty('_id');
//       expect(res.body.data.vehicleType).toBe('car');

//       // Verify in DB
//       const driverInDB = await DriverModel.findById(res.body.data._id);
//       expect(driverInDB).not.toBeNull();
//       expect(driverInDB.capacity.maxWeightKg).toBe(100);
//       expect(driverInDB.user.toString()).toBe(testUserId.toString());
//     });

//     it('should create a new driver successfully', async () => {
//       const driverData = {
//         vehicleType: 'bike',
//         status: 'offline',
//         capacity: { maxWeightKg: '100', maxPackages: '5' },
//         vehicleRegistrationNumber: 'ABC-1234', // required
//         timeAvailability: {
//           start: '08:00', // required
//           end: '18:00', // required
//         },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(201);
//       expect(res.body.success).toBe(true);
//       expect(res.body.data).toHaveProperty('_id');
//       expect(res.body.data.vehicleType).toBe('bike');

//       // Verify in DB
//       const driverInDB = await DriverModel.findById(res.body.data._id);
//       expect(driverInDB).not.toBeNull();
//       expect(driverInDB.capacity.maxWeightKg).toBe(100);
//       expect(driverInDB.user.toString()).toBe(testUserId.toString());
//     });

//     it('should fail if required field is missing (vehicleType)', async () => {
//       const driverData = {
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('vehicleType');
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if required field is missing (capacity)', async () => {
//       const driverData = {
//         status: 'idle',
//         vehicleType: 'car',
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('capacity');
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if maxWeightKg is negative', async () => {
//       const driverData = {
//         status: 'idle',
//         vehicleType: 'car',
//         capacity: { maxWeightKg: -1, maxPackages: -10 },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('capacity.maxWeightKg');
//       expect(res.body.message).toContain('Validation failed');
//       expect(res.body.code).toContain(ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE);
//     });

//     it('should fail if maxPackages is negative', async () => {
//       const driverData = {
//         status: 'idle',
//         vehicleType: 'car',
//         capacity: { maxWeightKg: 11, maxPackages: -10 },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('capacity.maxPackages');
//       expect(res.body.message).toContain('Validation failed');
//       expect(res.body.code).toContain(ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE);
//     });

//     it('should fail if maxPackages is not a number', async () => {
//       const driverData = {
//         status: 'idle',
//         vehicleType: 'car',
//         capacity: { maxWeightKg: 11, maxPackages: '123mahdi' },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('capacity.maxPackages');
//       expect(res.body.message).toContain('Validation failed');
//       expect(res.body.code).toContain(ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER);
//     });

//     it('should fail if maxWeightKg is not a number', async () => {
//       const driverData = {
//         status: 'idle',
//         vehicleType: 'car',
//         capacity: { maxWeightKg: 'mahdi', maxPackages: 123 },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.field).toBe('capacity.maxWeightKg');
//       expect(res.body.message).toContain('Validation failed');
//       expect(res.body.code).toContain(ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER);
//     });

//     it('should not allow creating duplicate driver for same user', async () => {
//       await DriverModel.create({
//         user: testUserId,
//         vehicleType: 'car',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         vehicleRegistrationNumber: 'ABC-123',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       });

//       const driverData = {
//         vehicleType: 'car',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         vehicleRegistrationNumber: 'ABC-123',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       };

//       const res = await request(app)
//         .post(baseURL)
//         .send(driverData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.DRIVER_ALREADY_EXIST);
//       expect(res.body.message).toMatch('Driver already exist');
//     });
//   });

//   describe('PUT /api/drivers/:id', () => {
//     let driverId;

//     beforeEach(async () => {
//       const driver = await DriverModel.create({
//         user: testUserId,
//         vehicleType: 'car',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { type: 'Point', coordinates: [0, 0] },
//         vehicleRegistrationNumber: 'ABC-1234',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       });
//       driverId = driver._id.toString();
//     });

//     it('should update driver partially', async () => {
//       const updateData = {
//         capacity: { maxWeightKg: 150 },
//         currentLocation: { coordinates: [10, 20] },
//       };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(200);
//       expect(res.body.success).toBe(true);
//       expect(res.body.data._id).toBe(driverId);
//       expect(res.body.data.capacity.maxWeightKg).toBe(150);
//       expect(res.body.data.capacity.maxPackages).toBe(5);
//       expect(res.body.data.currentLocation.coordinates).toEqual([10, 20]);
//     });

//     it('should fail if paramId is not a valid ObjectId', async () => {
//       const fakeId = '63cfa1234567a23123213';

//       const updateData = { status: 'delivering' };

//       const res = await request(app)
//         .put(`${baseURL}${fakeId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.message).toMatch('Invalid ID format');
//       expect(res.body.code).toMatch(ERROR_CODES.INVALID_ID);
//     });

//     it('should fail if driver does not exist', async () => {
//       const fakeId = '63cfa123456789abcdef0123';

//       const updateData = { status: 'delivering' };

//       const res = await request(app)
//         .put(`${baseURL}${fakeId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(404);
//       expect(res.body.message).toMatch(/Driver not found/i);
//       expect(res.body.code).toMatch(ERROR_CODES.NOT_FOUND);
//     });

//     it('should fail if no fields are provided', async () => {
//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send({})
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.message).toMatch('No fields provided for update');
//       expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
//     });

//     it('should fail if unauthorized', async () => {
//       const updateData = { status: 'idle' };

//       // We dont send the token.
//       const res = await request(app).put(`${baseURL}${driverId}`).send(updateData);

//       expect(res.status).toBe(401);
//       expect(res.body.message).toMatch('Unauthorized: Token missing');
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
//     });

//     it('should validate incorrect capacity values', async () => {
//       const updateData = { capacity: { maxWeightKg: 10, maxPackages: 'abc' } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should validate incorrect capacity values', async () => {
//       const updateData = { capacity: { maxWeightKg: -10 } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should validate incorrect capacity values', async () => {
//       const updateData = { capacity: { maxWeightKg: 'mahdi' } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should update driver coordinates', async () => {
//       const updateData = { currentLocation: { coordinates: [15, 33] } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(200);
//       expect(res.body.data.capacity.maxWeightKg).toBe(100);
//       expect(res.body.data.capacity.maxPackages).toBe(5);
//       expect(res.body.data.currentLocation.coordinates).toEqual([15, 33]);
//     });

//     it('should fail if currentLocation.coordinates are invalid', async () => {
//       const updateData = { currentLocation: { coordinates: ['ab', 33] } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if currentLocation.coordinates are invalid', async () => {
//       const updateData = { currentLocation: { coordinates: [12, 'abc'] } };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if currentLocation.coordinates are invalid', async () => {
//       const updateData = {
//         currentLocation: { coordinates: ['not', 'numbers'] },
//       };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if currentLocation.coordinates array length is not 2', async () => {
//       const updateData = {
//         currentLocation: { coordinates: [1, 2, 3] },
//       };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if lastLocationAt is not a valid date', async () => {
//       const updateData = { lastLocationAt: 'invalid-date' };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_ISO_DATE_FORMAT);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should fail if lastLocationAt is not a valid date', async () => {
//       const updateData = { lastLocationAt: '2024/1/1' };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(400);
//       expect(res.body.code).toBe(ERROR_CODES.INVALID_ISO_DATE_FORMAT);
//       expect(res.body.message).toContain('Validation failed');
//     });

//     it('should pass with valid coordinates and lastLocationAt', async () => {
//       const updateData = {
//         currentLocation: { coordinates: [34.5, 69.2] },
//         lastLocationAt: new Date().toISOString(),
//       };

//       const res = await request(app)
//         .put(`${baseURL}${driverId}`)
//         .send(updateData)
//         .set('Authorization', `Bearer ${token}`);

//       expect(res.status).toBe(200);
//       expect(res.body.success).toBe(true);
//       expect(res.body.data.currentLocation.coordinates).toEqual([34.5, 69.2]);
//       expect(new Date(res.body.data.lastLocationAt)).toBeInstanceOf(Date);
//     });
//   });
// });
