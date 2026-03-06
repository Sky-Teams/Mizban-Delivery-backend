import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { BusinessModel } from '#modules/businesses/index.js';
import { postWithAuth } from '#tests/utils/testHelpers.js';

let token;
let testUserId;

describe('Business API Integration', () => {
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

  let res;

  describe('POST /api/businesses', () => {
    it('should create new business successfully', async () => {
      const businessData = {
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: {
          type: 'Point',
          coordinates: [62.2, 34],
        },
        phone: '0093781234567',
        prepTimeAvgMinutes: 30,
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('owner');
      expect(res.body.data.type).toBe('restaurant');

      //In DB
      const businessInDB = await BusinessModel.findById(res.body.data._id);
      expect(businessInDB).not.toBeNull();
      expect(businessInDB.type).toBe('restaurant');
    });

    it('should fail if required field is missing => type', async () => {
      const businessData = {
        name: 'Reyhan Restaurant',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('type');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if required field is missing => name', async () => {
      const businessData = {
        type: 'shop',
        phone: '0093781234567',
        addressText: 'Afghanistan, Herat',
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('name');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if enter invalid phone number', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '078342',
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('phone');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.INVALID_PHONE_NUMBER);
    });

    it('should fail if prepTimeAvgMinutes is negative', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        phone: '0093781234567',
        addressText: 'Afghanistan, Herat',
        prepTimeAvgMinutes: -30,
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE);
    });

    it('should fail if prepTimeAvgMinutes is not number', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
        prepTimeAvgMinutes: 'hello',
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.PREP_TIME_MUST_BE_INTEGER);
    });
    it('should fail if coordinates length is not 2', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
        location: {
          type: 'Point',
          coordinates: [63],
        },
      };

      expect(res.status).toBe(400);
    });

    it('should fail if location type is invalid', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
        location: {
          type: 'point', // Point
          coordinates: [63, 32],
        },
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.field).toContain('location.type');
      expect(res.body.code).toContain(ERROR_CODES.INVALID_LOCATION_TYPE);
    });

    it('should create business with valid Afghanistan coordinates', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
        location: {
          type: 'Point',
          coordinates: [62.2, 34.3], //in range
        },
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);

      expect(res.status).toBe(201);
    });

    it('should fail if longitude is out of Afghanistan range', async () => {
      const businessData = {
        name: 'Reyhan Shop',
        type: 'shop',
        addressText: 'Afghanistan, Herat',
        phone: '0093781234567',
        location: {
          type: 'Point',
          coordinates: [80, 34.3], //out of range
        },
      };

      res = await postWithAuth(app, '/api/businesses', businessData, token);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.LNG_OUT_OF_RANGE);
    });
  });

  describe('GET /api/businesses', () => {
    it('should return all businesses for authenticated user', async () => {
      await BusinessModel.create([
        {
          owner: testUserId,
          name: 'Business A',
          type: 'restaurant',
          phone: '0093781234501',
          addressText: 'Herat, District 1',
        },
        {
          owner: testUserId,
          name: 'Business B',
          type: 'shop',
          phone: '0093781234502',
          addressText: 'Herat, District 2',
        },
      ]);

      res = await request(app).get('/api/businesses').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return empty array when there are no businesses', async () => {
      res = await request(app).get('/api/businesses').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should include expected fields in returned businesses', async () => {
      await BusinessModel.create({
        owner: testUserId,
        name: 'Business Details',
        type: 'warehouse',
        phone: '0093781234508',
        addressText: 'Herat, District 8',
      });

      res = await request(app).get('/api/businesses').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]).toHaveProperty('_id');
      expect(res.body.data[0]).toHaveProperty('name', 'Business Details');
      expect(res.body.data[0]).toHaveProperty('owner');
    });

    it('should fail with 401 when token is missing', async () => {
      res = await request(app).get('/api/businesses');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
      expect(res.body.message).toBe('Unauthorized: Token missing');
    });
  });

  describe('GET /api/businesses/:id', () => {
    it('should return business by id for authenticated user', async () => {
      const business = await BusinessModel.create({
        owner: testUserId,
        name: 'Business C',
        type: 'pharmacy',
        phone: '0093781234503',
        addressText: 'Herat, District 3',
      });

      res = await request(app)
        .get(`/api/businesses/${business._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(String(business._id));
      expect(res.body.data.name).toBe('Business C');
    });

    it('should return 404 when business id does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();

      res = await request(app)
        .get(`/api/businesses/${missingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Business not found');
    });

    it('should return 400 for invalid business id format', async () => {
      res = await request(app).get('/api/businesses/invalid-id').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
