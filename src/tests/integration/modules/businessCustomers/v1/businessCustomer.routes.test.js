import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../../../../app.js';
import {
  clearDB,
  connectDB,
  createFakeUserWithToken,
  disconnectDB,
} from '../../../../config/memoryDB.js';
import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const baseURL = '/api/business-customers/';
let token;

describe('BusinessCustomer API Integration', () => {
  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken();
    token = result.token;
  });

  describe('POST /api/business-customers', () => {
    it('creates business customer successfully', async () => {
      const businessId = '507f1f77bcf86cd799439011';
      const payload = {
        businessId,
        name: 'Customer One',
        phone: '0797123456',
        altPhone: '0797000000',
        addressText: 'Kabul district 4',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
        notes: 'first order',
        tags: ['new'],
      };

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.business).toBe(businessId);
      expect(res.body.data.phone).toBe(payload.phone);

      const inDB = await businessCustomerModel.findById(res.body.data._id);
      expect(inDB).not.toBeNull();
      expect(inDB.business.toString()).toBe(businessId);
      expect(inDB.totalOrders).toBe(0);
      expect(inDB.isActive).toBe(true);
      expect(inDB.lastOrderAt).toBeNull();
    });

    it('fails for duplicate customer phone under same business', async () => {
      const businessId = '507f1f77bcf86cd799439012';
      await businessCustomerModel.create({
        business: businessId,
        name: 'Existing',
        phone: '0797123456',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      });

      const payload = {
        businessId,
        name: 'Another',
        phone: '0797123456',
        addressText: 'Kabul district 5',
        location: { type: 'Point', coordinates: [69.3, 34.6] },
      };

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.BUSINESS_CUSTOMER_ALREADY_EXIST);
      expect(res.body.message).toBe('Business customer already exists');
    });

    it('fails when unauthorized', async () => {
      const payload = {
        businessId: '507f1f77bcf86cd799439013',
        name: 'No Token',
        phone: '0797222222',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      };

      const res = await request(app).post(baseURL).send(payload);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });

    it('fails validation when location coordinates are invalid', async () => {
      const payload = {
        businessId: '507f1f77bcf86cd799439014',
        name: 'Bad Coords',
        phone: '0797333333',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: ['bad', 34.5] },
      };

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_COORDINATES);
      expect(res.body.field).toBe('location.coordinates[0]');
    });
  });
});
