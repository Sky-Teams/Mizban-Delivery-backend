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
let testUserId;

describe('BusinessCustomer API Integration', () => {
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

  describe('POST /api/business-customers', () => {
    it('creates business customer successfully', async () => {
      const businessId = '507f1f77bcf86cd799439011';
      const payload = {
        businessId,
        name: 'Customer One',
        phone: '0797123456',
        altPhone: '0797000000',
        email: 'customer.one@example.com',
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
      expect(res.body.data.email).toBe(payload.email);

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
        email: 'existing@example.com',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      });

      const payload = {
        businessId,
        name: 'Another',
        phone: '0797123456',
        email: 'another@example.com',
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

    it('fails for duplicate customer email under same business', async () => {
      const businessId = '507f1f77bcf86cd799439015';
      await businessCustomerModel.create({
        business: businessId,
        name: 'Existing',
        phone: '0797444444',
        email: 'same@example.com',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      });

      const payload = {
        businessId,
        name: 'Another',
        phone: '0797555555',
        email: 'same@example.com',
        addressText: 'Kabul district 6',
        location: { type: 'Point', coordinates: [69.4, 34.7] },
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
        email: 'no.token@example.com',
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
        email: 'bad.coords@example.com',
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
      expect(res.body.field).toBe('location.coordinates');
    });
  });

  describe('PATCH /api/business-customers/:id', () => {
    let businessCustomerId;

    beforeEach(async () => {
      const businessCustomer = await businessCustomerModel.create({
        business: testUserId,
        name: 'Customer One',
        phone: '0797123456',
        altPhone: '0797000000',
        email: 'customer.one@example.com',
        addressText: 'Kabul district 4',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
        notes: 'first order',
        tags: ['new'],
      });

      businessCustomerId = businessCustomer._id.toString();
    });

    it('updates business customer partially', async () => {
      const payload = {
        name: 'Updated Customer',
        addressText: 'Kabul district 10',
        notes: 'updated note',
        tags: ['vip', 'priority'],
        isActive: false,
      };

      const res = await request(app)
        .patch(`${baseURL}${businessCustomerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(businessCustomerId);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.addressText).toBe(payload.addressText);
      expect(res.body.data.notes).toBe(payload.notes);
      expect(res.body.data.tags).toEqual(payload.tags);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.data.email).toBe('customer.one@example.com');
    });

    it('fails when id is not valid object id', async () => {
      const res = await request(app)
        .patch(`${baseURL}invalid-id`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
      expect(res.body.message).toMatch(/Invalid ID format|Validation failed/);
    });

    it('fails when no updatable fields are provided', async () => {
      const res = await request(app)
        .patch(`${baseURL}${businessCustomerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
      expect(res.body.message).toBe('No fields provided for update');
    });

    it('fails when only email is provided (email is not updatable)', async () => {
      const res = await request(app)
        .patch(`${baseURL}${businessCustomerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'new.email@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.NO_FIELDS_PROVIDED);
      expect(res.body.message).toBe('No fields provided for update');
    });

    it('fails when customer does not exist for this business scope', async () => {
      const missingId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .patch(`${baseURL}${missingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.message).toMatch(/BusinessCustomer not found/i);
    });

    it('fails when unauthorized', async () => {
      const res = await request(app)
        .patch(`${baseURL}${businessCustomerId}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
      expect(res.body.message).toMatch(/Unauthorized: Token missing/i);
    });
  });
});
