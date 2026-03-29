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
import { OrderModel } from '#modules/orders/models/order.model.js';
import { postWithAuth } from '#tests/utils/testHelpers.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';
import { DriverModel } from '#modules/drivers/index.js';

const baseURL = '/api/orders';
let token;
let adminUserId;

describe('Order API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken('admin');
    adminUserId = result.testUserId;
    token = result.token;
  });

  describe('Order API v1 Integration - create order request', () => {
    beforeEach(async () => {
      await clearDB();
      const result = await createFakeUserWithToken('admin');
      adminUserId = result.testUserId;
      token = result.token;
    });

    it('should create a order request successfully', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
        deliveryPrice: { total: 20 },
      };

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.status).toBe('created');
      expect(res.body.data.finalPrice).toBe(120);

      // Verify in DB
      const orderInDB = await OrderModel.findById(res.body.data._id);
      expect(orderInDB).not.toBeNull();
      expect(orderInDB.sender.name).toBe('Alice');
      expect(orderInDB.receiver.name).toBe('Bob');
    });

    it('should fail if required field is missing', async () => {
      const orderData = {
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

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('type');
      expect(res.body.message).toContain('Validation failed');
    });

    it('should fail if user is not admin', async () => {
      await clearDB();

      const normalUser = await createFakeUserWithToken('customer');

      const orderData = {
        type: 'parcel',
        serviceType: 'express',
        sender: { name: 'Alice', phone: '123456' },
        receiver: {
          name: 'Bob',
          phone: '987654',
          addressText: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      const res = await request(app)
        .post(baseURL)
        .set('Authorization', `Bearer ${normalUser.token}`)
        .send(orderData);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should fail if authorization header is missing', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'express',
        sender: { name: 'Alice', phone: '123456' },
        receiver: {
          name: 'Bob',
          phone: '987654',
          addressText: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      const res = await request(app).post(baseURL).send(orderData);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it('should assign driver if driverId exists', async () => {
      const driverUser = await createFakeDriver();
      const driverId = driverUser._id;

      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        driverId,
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      const res = await postWithAuth(app, baseURL, orderData, token);
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('assigned');
      expect(res.body.data.timeline.assignedAt).toBeDefined();
    });

    it('should throw notFound if driverId does not exist', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        driverId: new mongoose.Types.ObjectId(),
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Driver not found/i);
    });

    it('should throw invalidId if driverId is invalid', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        driverId: 'mahdiHasanzadeh',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_DRIVER_ID);
      expect(res.body.message).toMatch('Validation failed');
    });

    it('should calculate items total correctly', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
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

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(201);
      expect(res.body.data.items[0].total).toBe(20);
      expect(res.body.data.items[1].total).toBe(15);
    });

    it('should handle missing optional deliveryPrice', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 50,
      };

      const res = await postWithAuth(app, baseURL, orderData, token);

      expect(res.status).toBe(201);
      expect(res.body.data.finalPrice).toBe(50);
      expect(res.body.data.status).toBe('created');
    });

    it('should calculate total for each item in the order request', async () => {
      const orderData = {
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
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
        .send(orderData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].total).toBe(20); // 2 * 10
      expect(res.body.data.items[1].total).toBe(15); // 3 * 5

      // Verify in DB
      const orderInDB = await OrderModel.findById(res.body.data._id);
      expect(orderInDB.items[0].total).toBe(20);
      expect(orderInDB.items[1].total).toBe(15);
    });
  });

  describe('Order API v1 Integration - update order request', () => {
    let deliveryId;

    beforeEach(async () => {
      await clearDB();

      const result = await createFakeUserWithToken('admin');
      adminUserId = result.testUserId;
      token = result.token;

      const order = await OrderModel.create({
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.3, 34.36] },
        paymentType: 'COD',
        amountToCollect: 100,
        finalPrice: 100,
        status: 'created',
      });

      deliveryId = order._id.toString();
    });

    it('should update order request successfully', async () => {
      const updateData = {
        amountToCollect: 200,
      };

      const res = await request(app)
        .put(`${baseURL}/${deliveryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amountToCollect).toBe(200);

      const updatedDelivery = await OrderModel.findById(deliveryId);
      expect(updatedDelivery.amountToCollect).toBe(200);
    });

    it('should fail if order request does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`${baseURL}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amountToCollect: 300 });

      expect(res.status).toBe(404);
      console.log(res.body);
      expect(res.body.code).toMatch(ERROR_CODES.NOT_FOUND);
    });

    it('should fail if user is not admin', async () => {
      await clearDB();

      const normalUser = await createFakeUserWithToken('customer');

      const res = await request(app)
        .put(`${baseURL}/${deliveryId}`)
        .set('Authorization', `Bearer ${normalUser.token}`)
        .send({ amountToCollect: 300 });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should fail if authorization header is missing', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}`)
        .send({ amountToCollect: 300 });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it('should fail if order is already delivered', async () => {
      await OrderModel.findByIdAndUpdate(deliveryId, {
        status: 'delivered',
      });

      const res = await request(app)
        .put(`${baseURL}/${deliveryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amountToCollect: 500 });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ERROR_CODES.UPDATE_NOT_AVAILABLE);
    });
  });

  describe('Order API v1 Integration - assign driver', () => {
    let deliveryId;
    let driver;

    beforeEach(async () => {
      await clearDB();
      const result = await createFakeUserWithToken('admin');
      adminUserId = result.testUserId;
      token = result.token;
      const orderData = {
        type: 'parcel',
        serviceType: 'express',
        sender: { name: 'Alice', phone: '123456' },
        receiver: {
          name: 'Bob',
          phone: '987654',
          addressText: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        paymentType: 'COD',
        amountToCollect: 100,
      };

      driver = await createFakeDriver();

      const order = await OrderModel.create({
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.3, 34.36] },
        paymentType: 'COD',
        amountToCollect: 100,
        finalPrice: 100,
        status: 'created',
      });

      deliveryId = order._id.toString();
    });

    it('should assign driver successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ driverId: driver._id });

      const updatedDriver = await DriverModel.findById(driver._id);

      expect(res.status).toBe(200);
      expect(updatedDriver.status).toBe('assigned');
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('assigned');
      expect(res.body.data.timeline.assignedAt).toBeDefined();

      const orderInDB = await OrderModel.findById(deliveryId);
      expect(orderInDB.driverId.toString()).toBe(driver._id.toString());
    });

    it('should fail if driver does not exist', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ driverId: new mongoose.Types.ObjectId() });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Driver not found/i);
    });

    it('should fail if order request does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`${baseURL}/${fakeId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ driverId: driver._id });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/DeliveryRequest not found/i);
    });

    it('should fail if driverId is invalid', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ driverId: 'invalidDriverId' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_DRIVER_ID);
    });

    it('should fail if user is not admin', async () => {
      await clearDB();

      const normalUser = await createFakeUserWithToken('customer');

      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${normalUser.token}`)
        .send({ driverId: driver._id });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should fail if authorization header is missing', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/assign`)
        .send({ driverId: driver._id });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe('Order API v1 Integration - pickup order', () => {
    let deliveryId;
    let driver;

    beforeEach(async () => {
      await clearDB();

      const result = await createFakeUserWithToken('admin');
      token = result.token;

      driver = await createFakeDriver();

      const order = await OrderModel.create({
        type: 'parcel',
        serviceType: 'immediate',
        driverId: driver._id,
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.3, 34.36] },
        paymentType: 'COD',
        amountToCollect: 100,
        finalPrice: 100,
        status: 'assigned',
        timeline: { assignedAt: new Date() },
      });

      deliveryId = order._id.toString();
    });

    it('should pickup order successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/pickup`)
        .set('Authorization', `Bearer ${token}`);

      const updatedDriver = await DriverModel.findById(driver._id);

      expect(res.status).toBe(200);
      expect(updatedDriver.status).toBe('delivering');
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pickedUp');
      expect(res.body.data.timeline.pickedUpAt).toBeDefined();
    });

    it('should fail if order does not exist', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${new mongoose.Types.ObjectId()}/pickup`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should fail if order status is not assigned', async () => {
      await OrderModel.findByIdAndUpdate(deliveryId, {
        status: 'created',
      });

      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/pickup`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
    });

    it('should fail if authorization header missing', async () => {
      const res = await request(app).patch(`${baseURL}/${deliveryId}/pickup`);

      expect(res.status).toBe(401);
    });
  });

  describe('Order API v1 Integration - deliver order', () => {
    let deliveryId;
    let driver;

    beforeEach(async () => {
      await clearDB();
      const result = await createFakeUserWithToken('admin');
      token = result.token;
      driver = await createFakeDriver();
      const order = await OrderModel.create({
        type: 'parcel',
        serviceType: 'immediate',
        driverId: driver._id,
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.3, 34.36] },
        paymentType: 'COD',
        amountToCollect: 100,
        finalPrice: 100,
        status: 'pickedUp',
        timeline: { pickedUpAt: new Date() },
      });

      deliveryId = order._id.toString();
    });

    it('should deliver order successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/deliver`)
        .set('Authorization', `Bearer ${token}`);

      const updatedDriver = await DriverModel.findById(driver._id);

      expect(res.status).toBe(200);
      expect(updatedDriver.status).toBe('idle');
      expect(res.body.data.status).toBe('delivered');
      expect(res.body.data.timeline.deliveredAt).toBeDefined();
    });

    it('should fail if order does not exist', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${new mongoose.Types.ObjectId()}/deliver`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should fail if order status is not pickedUp', async () => {
      await OrderModel.findByIdAndUpdate(deliveryId, {
        status: 'assigned',
      });

      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/deliver`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
    });

    it('should fail if authorization header missing', async () => {
      const res = await request(app).patch(`${baseURL}/${deliveryId}/deliver`);

      expect(res.status).toBe(401);
    });
  });

  describe('Order API v1 Integration - cancel order', () => {
    let deliveryId;
    beforeEach(async () => {
      await clearDB();
      const result = await createFakeUserWithToken('admin');
      token = result.token;

      const order = await OrderModel.create({
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '0790909090' },
        receiver: {
          name: 'Bob',
          phone: '0790909090',
          address: 'Herat',
        },
        pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
        dropoffLocation: { type: 'Point', coordinates: [62.3, 34.36] },
        paymentType: 'COD',
        amountToCollect: 100,
        finalPrice: 100,
        status: 'created',
      });

      deliveryId = order._id.toString();
    });

    it('should throw notFound if driverId does not exist', async () => {});

    it('should cancel order successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cancelReason: 'Customer cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
      expect(res.body.data.cancelReason).toBe('Customer cancelled');
    });

    it('should cancel order without reason', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
    });

    it('should fail if order does not exist', async () => {
      const res = await request(app)
        .patch(`${baseURL}/${new mongoose.Types.ObjectId()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(404);
    });

    it('should fail if order already delivered', async () => {
      await OrderModel.findByIdAndUpdate(deliveryId, {
        status: 'delivered',
      });

      const res = await request(app)
        .patch(`${baseURL}/${deliveryId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(409);
    });
  });
});
