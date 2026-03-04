import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
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
import { putWithAuth } from '#tests/utils/testHelpers.js';

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

  //Partial Update (Business)
  describe('PUT /api/businesses/:id', () => {
    let businessId;
    beforeEach(async () => {
      const business = await BusinessModel.create({
        owner: testUserId,
        name: 'Pink Fast Food ',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        phone: '0781234567',
      });
      businessId = business._id.toString();
    });

    it('should update business successfully when user is the owner', async () => {
      const updateData = {
        location: { type: 'Point', coordinates: [63.2, 32.4] },
        prepTimeAvgMinutes: 30,
      };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(businessId);
    });

    it('should return 401 if token is missing', async () => {
      const updateData = { type: 'shop' };
      res = await request(app).put(`/api/businesses/${businessId}`).send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Unauthorized: Token missing');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });

    it('should return 403 when authenticated user is not the business owner', async () => {
      const user = await UserModel.create({
        email: 'Test@gmail.com',
        name: 'test',
        password: 'test123',
      });

      const newBusiness = await BusinessModel.create({
        owner: user._id,
        name: 'Shaqaeq Shop',
        type: 'shop',
        addressText: 'Afghanistan , Herat',
        phone: '0781234567',
      });

      const Id = newBusiness._id.toString();

      const updateData = { type: 'other' };
      res = await putWithAuth(app, `/api/businesses/${Id}`, updateData, token);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch('You donot have permission to update');
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should fail if params id is invalid', async () => {
      const fakeId = '69a563ba08c2261290c6a4d';
      const updateData = { type: 'shop' };

      res = await putWithAuth(app, `/api/businesses/${fakeId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
      expect(res.body.message).toBe('Invalid ID format');
    });

    it('should fail if business does not exist', async () => {
      const fakeId = '69a55fdb1df074fb7dfa10f9';
      const updateData = { type: 'shop' };

      res = await putWithAuth(app, `/api/businesses/${fakeId}`, updateData, token);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.message).toBe('Business not found');
    });

    it('should fail if no fields provided for update', async () => {
      const updateData = {};

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
      expect(res.body.message).toBe('No fields provided for update');
    });

    it('should fail if phone is not valid', async () => {
      const updateData = { phone: '09409' };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_PHONE_NUMBER);
      expect(res.body.field).toBe('phone');
    });

    it('should fail if location.coordinates are invalid', async () => {
      const updateData = { location: { coordinates: ['herat', 'kabul'] } };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if location.coordinates array length is not 2', async () => {
      const updateData = { location: { coordinates: [62, 32, 1] } };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if location.coordinates when longitude or latitude is out of allowed range', async () => {
      const updateData = { location: { coordinates: [80, 30] } };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.LNG_OUT_OF_RANGE);
    });

    it('should fail if prepTimeAvgMinutes is negative', async () => {
      const updateData = { prepTimeAvgMinutes: -30 };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE);
    });

    it('should fail if prepTimeAvgMinutes is integer', async () => {
      const updateData = { prepTimeAvgMinutes: 'one' };

      res = await putWithAuth(app, `/api/businesses/${businessId}`, updateData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PREP_TIME_MUST_BE_INTEGER);
    });
  });
});
