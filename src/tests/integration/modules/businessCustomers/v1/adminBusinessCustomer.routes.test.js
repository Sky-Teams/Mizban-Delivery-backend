import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../../../../app.js';
import {
  clearDB,
  connectDB,
  createFakeUserWithToken,
  disconnectDB,
} from '../../../../config/memoryDB.js';
import { businessCustomerModel } from '#modules/businessCustomers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { BusinessModel } from '#modules/businesses/index.js';

const baseURL = '/api/admin/business-customers';

let token;
let testUserId;
let business;

describe('Admin BusinessCustomer API Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    const user = await createFakeUserWithToken('admin');
    token = user.token;
    testUserId = user.testUserId;

    business = await BusinessModel.create({
      owner: testUserId,
      name: 'Kabul Fresh',
      type: 'shop',
      phone: '+93700123456',
      addressText: 'Kart-e-Char, Kabul',
      prepTimeAvgMinutes: 20,
    });
  });

  describe('POST /api/admin/business-customers', () => {
    let validPayload;

    beforeEach(() => {
      validPayload = {
        businessId: business._id.toString(),
        name: 'Admin Customer',
        phone: '+93797123000',
        altPhone: '+93797123001',
        email: 'admin.customer@example.com',
        addressText: 'Kabul district 10',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      };
    });

    it('creates business customer successfully for authenticated user', async () => {
      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');

      const inDB = await businessCustomerModel.findById(res.body.data._id);
      expect(inDB).not.toBeNull();
      expect(inDB.business.toString()).toBe(validPayload.businessId);
    });

    it('fails when required field "businessId" is missing', async () => {
      const { businessId, ...payload } = validPayload;

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('businessId');
    });

    it('fails when token is missing', async () => {
      const res = await request(app).post(baseURL).send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('PATCH /api/admin/business-customers/:id', () => {
    it('updates business customer successfully for authenticated user', async () => {
      const seeded = await businessCustomerModel.create({
        business: business._id,
        name: 'Before Update',
        phone: '0797000001',
        email: 'before.update@example.com',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      });

      const payload = {
        name: 'After Update',
        notes: 'updated from admin route test',
      };

      const res = await request(app)
        .patch(`${baseURL}/${seeded._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDB = await businessCustomerModel.findById(seeded._id);
      expect(inDB?.name).toBe(payload.name);
      expect(inDB?.notes).toBe(payload.notes);
    });

    it('fails when patch id is invalid', async () => {
      const res = await request(app)
        .patch(`${baseURL}/invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Any' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
    });

    it('fails when patch token is missing', async () => {
      const id = '507f1f77bcf86cd799439202';

      const res = await request(app).patch(`${baseURL}/${id}`).send({ name: 'Any' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
