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
let testUserId;

describe('Admin BusinessCustomer API Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const user = await createFakeUserWithToken({
      role: 'admin',
      email: 'admin-business-customer@example.com',
    });
    token = user.token;
    testUserId = user.testUserId;
  });

  describe('POST /api/admin/business-customers', () => {
    const validPayload = {
      businessId: '507f1f77bcf86cd799439111',
      name: 'Admin Customer',
      phone: '0797123000',
      email: 'admin.customer@example.com',
      addressText: 'Kabul district 10',
      location: { type: 'Point', coordinates: [69.2, 34.5] },
    };

    it('creates business customer successfully for authenticated user', async () => {
      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.business).toBe(validPayload.businessId);

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

    it('fails when required field "name" is missing', async () => {
      const { name, ...payload } = validPayload;
      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('name');
    });

    it('fails when required field "phone" is missing', async () => {
      const { phone, ...payload } = validPayload;
      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('phone');
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

  describe('PATCH /api/admin/business-customers/:id', () => {
    it('updates business customer successfully for authenticated user', async () => {
      const seeded = await businessCustomerModel.create({
        business: testUserId,
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
      expect(res.body.data._id).toBe(seeded._id.toString());
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.notes).toBe(payload.notes);

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
