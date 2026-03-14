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
import { UserModel } from '#modules/users/index.js';
import { postWithAuth, putWithAuth } from '#tests/utils/testHelpers.js';

let token;
let testUserId;
const baseURL = '/api/businesses';

describe('Admin Business API Integration', async () => {
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

  let res;

  //create business
  describe('POST /api/businesses', () => {
    const business = {
      username: 'business',
      email: 'business@gmail.com',
      userPhoneNumber: '+93700001234',
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

    it('should create new business successfully', async () => {
      const businessData = { ...business };
      res = await postWithAuth(app, baseURL, businessData, token);

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
      const businessData = { ...business };
      delete businessData.type;

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('type');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if required field is missing => name', async () => {
      const businessData = { ...business };
      delete businessData.name;
      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('name');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if enter invalid phone number', async () => {
      const businessData = { ...business, phone: '098' };

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('phone');
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.INVALID_PHONE_NUMBER);
    });

    it('should fail if prepTimeAvgMinutes is negative', async () => {
      const businessData = { ...business, prepTimeAvgMinutes: -30 };

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE);
    });

    it('should fail if prepTimeAvgMinutes is not number', async () => {
      const businessData = { ...business, prepTimeAvgMinutes: 'hello' };

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.code).toContain(ERROR_CODES.PREP_TIME_MUST_BE_INTEGER);
    });

    it('should fail if coordinates length is not 2', async () => {
      const businessData = { ...business, location: { coordinates: [62] } };
      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
    });

    it('should fail if location type is invalid', async () => {
      const businessData = { ...business, location: { type: 'point', coordinates: [62, 32] } };

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.field).toContain('location.type');
      expect(res.body.code).toContain(ERROR_CODES.INVALID_LOCATION_TYPE);
    });

    it('should create business with valid Afghanistan coordinates', async () => {
      const businessData = {
        ...business,
        location: {
          type: 'Point',
          coordinates: [62.2, 34.3], //in range
        },
      };

      res = await postWithAuth(app, baseURL, businessData, token);

      expect(res.status).toBe(201);
    });

    it('should fail if longitude is out of Afghanistan range', async () => {
      const businessData = {
        ...business,
        location: {
          type: 'Point',
          coordinates: [80, 34.3], //out of range
        },
      };

      res = await postWithAuth(app, baseURL, businessData, token);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.LNG_OUT_OF_RANGE);
    });
  });

  //Partial Update (Business)
  describe('PUT /api/businesses/:id', () => {
    let businessId;
    let user;
    beforeEach(async () => {
      user = await UserModel.create({
        name: 'Test',
        email: 'test12@example.com',
        password: 'password123',
      });
      const business = await BusinessModel.create({
        owner: user._id,
        name: 'Pink Fast Food ',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        phone: '0781234567',
      });
      businessId = business._id.toString();
    });

    it('should update business successfully', async () => {
      const updateData = {
        location: { type: 'Point', coordinates: [63.2, 32.4] },
        prepTimeAvgMinutes: 30,
      };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(businessId);
    });

    it('should return 401 if token is missing', async () => {
      const updateData = { type: 'shop' };
      res = await request(app).put(`${baseURL}/${businessId}`).send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Unauthorized: Token missing');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });

    it('should fail if params id is invalid', async () => {
      const fakeId = '69a563ba08c2261290c6a4d';
      const updateData = { type: 'shop' };

      res = await putWithAuth(app, `${baseURL}/${fakeId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
      expect(res.body.message).toBe('Invalid ID format');
    });

    it('should fail if business does not exist', async () => {
      const fakeId = '69a55fdb1df074fb7dfa10f9';
      const updateData = { type: 'shop' };

      res = await putWithAuth(app, `${baseURL}/${fakeId}`, updateData, token);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should fail if no fields provided for update', async () => {
      const updateData = {};

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
    });

    it('should fail if phone is not valid', async () => {
      const updateData = { phone: '09409' };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_PHONE_NUMBER);
      expect(res.body.field).toBe('phone');
    });

    it('should fail if location.coordinates are invalid', async () => {
      const updateData = { location: { coordinates: ['herat', 'kabul'] } };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if location.coordinates array length is not 2', async () => {
      const updateData = { location: { coordinates: [62, 32, 1] } };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if location.coordinates when longitude or latitude is out of allowed range', async () => {
      const updateData = { location: { coordinates: [80, 30] } };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.LNG_OUT_OF_RANGE);
    });

    it('should fail if prepTimeAvgMinutes is negative', async () => {
      const updateData = { prepTimeAvgMinutes: -30 };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE);
    });

    it('should fail if prepTimeAvgMinutes is integer', async () => {
      const updateData = { prepTimeAvgMinutes: 'one' };

      res = await putWithAuth(app, `${baseURL}/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PREP_TIME_MUST_BE_INTEGER);
    });
  });

  describe(`GET ${baseURL}`, () => {
    it('should return all businesses for authenticated admin user', async () => {
      await BusinessModel.create([
        {
          owner: testUserId,
          name: 'Test Restaurant',
          type: 'restaurant',
          phone: '0093781234567',
          addressText: 'Herat, Afghanistan',
        },
        {
          owner: testUserId,
          name: 'Test Shop',
          type: 'shop',
          phone: '0093781234568',
          addressText: 'Herat, Afghanistan',
        },
      ]);

      const response = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name', 'Test Restaurant');
      expect(response.body.data[0]).toHaveProperty('owner');
    });

    it('should return empty array when there are no businesses', async () => {
      const response = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should fail with 401 when token is missing', async () => {
      const response = await request(app).get(baseURL);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(ERROR_CODES.INVALID_JWT);
      expect(response.body.message).toBe('Unauthorized: Token missing');
    });
  });

  describe(`GET ${baseURL}/:id`, () => {
    it('should return business by id for authenticated admin user', async () => {
      const business = await BusinessModel.create({
        owner: testUserId,
        name: 'Test Restaurant',
        type: 'restaurant',
        phone: '0093781234567',
        addressText: 'Herat, Afghanistan',
      });

      const response = await request(app)
        .get(`${baseURL}/${business._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(String(business._id));
      expect(response.body.data.name).toBe('Test Restaurant');
      expect(response.body.data).toHaveProperty('owner');
    });

    it('should return 404 when business id does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`${baseURL}/${missingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should return 400 for invalid business id format', async () => {
      const response = await request(app)
        .get(`${baseURL}/invalid-id`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid ID format');
    });
  });
});
