import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
  createFakeDriver,
} from '../../../../config/memoryDB.js';
import { DeliveryRequestModel } from '#modules/deliveryRequests/models/deliveryRequest.model.js';
import { postWithAuth } from '#tests/utils/testHelpers.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';

const baseURL = '/api/admin/delivery-request';
let token;
let adminUserId;

describe('Admin Delivery Request API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  }, 30000);

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken('admin');
    adminUserId = result.testUserId;
    token = result.token;
  });

  it('should create a delivery request successfully', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
      deliveryPrice: { total: 20 },
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.status).toBe('created');
    expect(res.body.data.finalPrice).toBe(120);

    // Verify in DB
    const deliveryInDB = await DeliveryRequestModel.findById(res.body.data._id);
    expect(deliveryInDB).not.toBeNull();
    expect(deliveryInDB.sender.name).toBe('Alice');
    expect(deliveryInDB.receiver.name).toBe('Bob');
  });

  it('should fail if required field is missing', async () => {
    const deliveryData = {
      serviceType: 'immediate',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        addressText: 'Herat',
        location: { coordinates: [62.2, 34.35] },
      },
      pickupLocation: { coordinates: [62.2, 34.35] },
      dropoffLocation: { coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('type');
    expect(res.body.message).toContain('Validation failed');
  });

  it('should fail if user is not admin', async () => {
    await clearDB();

    const normalUser = await createFakeUserWithToken('customer');

    const deliveryData = {
      type: 'parcel',
      serviceType: 'express',
      sender: { name: 'Alice', phone: '123456' },
      receiver: {
        name: 'Bob',
        phone: '987654',
        addressText: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await request(app)
      .post(baseURL)
      .set('Authorization', `Bearer ${normalUser.token}`)
      .send(deliveryData);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('should fail if authorization header is missing', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'express',
      sender: { name: 'Alice', phone: '123456' },
      receiver: {
        name: 'Bob',
        phone: '987654',
        addressText: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await request(app).post(baseURL).send(deliveryData);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/unauthorized/i);
  });

  it('should assign driver if driverId exists', async () => {
    const driverUser = await createFakeDriver();
    const driverId = driverUser._id;

    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      driverId,
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.timeline.assignedAt).toBeDefined();
  });

  it('should throw notFound if driverId does not exist', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      driverId: new mongoose.Types.ObjectId(),
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Driver not found/i);
  });

  it('should throw invalidId if driverId is invalid', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      driverId: 'mahdiHasanzadeh',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_DRIVER_ID);
    expect(res.body.message).toMatch('Validation failed');
  });

  it('should calculate items total correctly', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
      items: [
        { name: 'Item A', quantity: 2, unitPrice: 10 },
        { name: 'Item B', quantity: 3, unitPrice: 5 },
      ],
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].total).toBe(20);
    expect(res.body.data.items[1].total).toBe(15);
  });

  it('should handle missing optional deliveryPrice', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 50,
    };

    const res = await postWithAuth(app, baseURL, deliveryData, token);

    expect(res.status).toBe(201);
    expect(res.body.data.finalPrice).toBe(50);
    expect(res.body.data.status).toBe('created');
  });

  it('should calculate total for each item in the delivery request', async () => {
    const deliveryData = {
      type: 'parcel',
      serviceType: 'immediate',
      sender: { name: 'Alice', phone: '0790909090' },
      receiver: {
        name: 'Bob',
        phone: '0790909090',
        address: 'Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
      },
      pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
      paymentType: 'COD',
      amountToCollect: 100,
      deliveryPrice: { total: 20 },
      items: [
        { name: 'Item A', quantity: 2, unitPrice: 10 },
        { name: 'Item B', quantity: 3, unitPrice: 5 },
      ],
    };

    const res = await request(app)
      .post(baseURL)
      .set('Authorization', `Bearer ${token}`)
      .send(deliveryData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].total).toBe(20); // 2 * 10
    expect(res.body.data.items[1].total).toBe(15); // 3 * 5

    // Verify in DB
    const deliveryInDB = await DeliveryRequestModel.findById(res.body.data._id);
    expect(deliveryInDB.items[0].total).toBe(20);
    expect(deliveryInDB.items[1].total).toBe(15);
  });
});
