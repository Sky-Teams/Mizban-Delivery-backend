import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
});
