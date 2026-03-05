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

const baseURL = '/api/admin/business-customers';
let token;

describe('Admin BusinessCustomer API Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const user = await createFakeUserWithToken();
    token = user.token;
  });

  describe('POST /api/admin/business-customers', () => {
    it('creates business customer successfully for authenticated user', async () => {
      const businessId = '507f1f77bcf86cd799439111';
      const payload = {
        businessId,
        name: 'Admin Customer',
        phone: '0797123000',
        email: 'admin.customer@example.com',
        addressText: 'Kabul district 10',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      };

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.business).toBe(businessId);

      const inDB = await businessCustomerModel.findById(res.body.data._id);
      expect(inDB).not.toBeNull();
      expect(inDB.business.toString()).toBe(businessId);
    });

    it('fails when token is missing', async () => {
      const payload = {
        businessId: '507f1f77bcf86cd799439113',
        name: 'No Token',
        phone: '0797123222',
        email: 'no.token.admin@example.com',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      };

      const res = await request(app).post(baseURL).send(payload);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
