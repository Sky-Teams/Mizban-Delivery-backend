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

const ADMIN_BUSINESS_BASE_URL = '/api/admin/businesses';

let adminToken;
let testUserId;

describe('Admin Business Routes Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    // Create admin user
    const adminResult = await createFakeUserWithToken('admin');
    adminToken = adminResult.token;
    testUserId = adminResult.testUserId;
  });

  describe(`GET ${ADMIN_BUSINESS_BASE_URL}`, () => {
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

      const response = await request(app)
        .get(ADMIN_BUSINESS_BASE_URL)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty array when there are no businesses', async () => {
      const response = await request(app)
        .get(ADMIN_BUSINESS_BASE_URL)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should fail with 401 when token is missing', async () => {
      const response = await request(app).get(ADMIN_BUSINESS_BASE_URL);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(ERROR_CODES.INVALID_JWT);
      expect(response.body.message).toBe('Unauthorized: Token missing');
    });
  });

  describe(`GET ${ADMIN_BUSINESS_BASE_URL}/:id`, () => {
    it('should return business by id for authenticated admin user', async () => {
      const business = await BusinessModel.create({
        owner: testUserId,
        name: 'Test Restaurant',
        type: 'restaurant',
        phone: '0093781234567',
        addressText: 'Herat, Afghanistan',
      });

      const response = await request(app)
        .get(`${ADMIN_BUSINESS_BASE_URL}/${business._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(String(business._id));
      expect(response.body.data.name).toBe('Test Restaurant');
      expect(response.body.data).toHaveProperty('owner');
    });

    it('should return 404 when business id does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`${ADMIN_BUSINESS_BASE_URL}/${missingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should return 400 for invalid business id format', async () => {
      const response = await request(app)
        .get(`${ADMIN_BUSINESS_BASE_URL}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid ID format');
    });
  });
});
