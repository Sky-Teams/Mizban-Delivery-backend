import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
  createFakeDriver,
  createFakeOrder,
} from '../../../../config/memoryDB.js';
import { getWithAuth } from '#tests/utils/testHelpers.js';
import { OfferModel } from '#modules/offers/models/offer.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { OFFER_STATUS } from '#shared/utils/enums.js';
import mongoose from 'mongoose';

const baseURL = '/api/offers';

// Helper to create an offer for a given driver/order
const createFakeOffer = async (overrides = {}) => {
  const order = overrides.order || (await createFakeOrder())._id;
  return OfferModel.create({
    order,
    driver: overrides.driver,
    status: overrides.status || OFFER_STATUS.PENDING,
    offeredAt: new Date(),
    expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    ...overrides,
  });
};

describe('Offer API v1 Integration', () => {
  let token;
  let driver;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken('driver');
    token = result.token;
    driver = await createFakeDriver(result.user);
  });

  describe('GET /api/offers/:id', () => {
    it('should return an offer by id for the driver', async () => {
      const offer = await createFakeOffer({ driver: driver._id });

      const res = await getWithAuth(app, `${baseURL}/${offer._id}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(res.body.data._id).toBe(offer._id.toString());
      expect(res.body.data.status).toBe(offer.status);
      expect(res.body.data.offeredAt).toBeDefined();
      expect(res.body.data.expiredAt).toBeDefined();
      expect(res.body.data.respondedAt).toBeNull();

      expect(res.body.data.order).toBeDefined();
      expect(res.body.data.order._id).toBe(offer.order.toString());
    });

    it('should return null if offer does not belong to the driver', async () => {
      const otherDriverUser = await createFakeUserWithToken('driver');
      const otherDriver = await createFakeDriver(otherDriverUser.user);
      const offer = await createFakeOffer({ driver: otherDriver._id });

      const res = await getWithAuth(app, `${baseURL}/${offer._id}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should return null if offer does not exist', async () => {
      const res = await getWithAuth(app, `${baseURL}/${new mongoose.Types.ObjectId()}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should throw notFound if the driver record does not exist', async () => {
      const userWithoutDriver = await createFakeUserWithToken('driver');
      const offer = await createFakeOffer({ driver: driver._id });

      const res = await getWithAuth(app, `${baseURL}/${offer._id}`, userWithoutDriver.token);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Driver not found/i);
    });

    it('should fail if id is not a valid mongo id', async () => {
      const res = await getWithAuth(app, `${baseURL}/invalidId`, token);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
    });

    it('should fail if user is not a driver', async () => {
      const admin = await createFakeUserWithToken('admin');
      const offer = await createFakeOffer({ driver: driver._id });

      const res = await getWithAuth(app, `${baseURL}/${offer._id}`, admin.token);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should fail if authorization header is missing', async () => {
      const offer = await createFakeOffer({ driver: driver._id });

      const res = await getWithAuth(app, `${baseURL}/${offer._id}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('GET /api/offers', () => {
    beforeEach(async () => {
      await createFakeOffer({ driver: driver._id, status: OFFER_STATUS.PENDING });
      await createFakeOffer({ driver: driver._id, status: OFFER_STATUS.ACCEPTED });
      await createFakeOffer({ driver: driver._id, status: OFFER_STATUS.REJECTED });
    });

    it('should return all offers of the driver', async () => {
      const res = await getWithAuth(app, baseURL, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.totalOffers).toBe(3);
      expect(res.body.totalPages).toBe(1);
    });

    it('should return offers filtered by status', async () => {
      const res = await getWithAuth(app, `${baseURL}/?status=${OFFER_STATUS.PENDING}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(OFFER_STATUS.PENDING);
    });

    it('should only return offers belonging to the requesting driver', async () => {
      const otherDriverUser = await createFakeUserWithToken('driver');
      const otherDriver = await createFakeDriver(otherDriverUser.user);
      await createFakeOffer({ driver: otherDriver._id });

      const res = await getWithAuth(app, baseURL, token);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should paginate the offers', async () => {
      const res = await getWithAuth(app, `${baseURL}/?page=1&limit=2`, token);

      expect(res.status).toBe(200);
      expect(res.body.totalOffers).toBe(3);
      expect(res.body.totalPages).toBe(2);
    });

    it('should return an empty list when the driver has no offers', async () => {
      const freshUser = await createFakeUserWithToken('driver');
      await createFakeDriver(freshUser.user);

      const res = await getWithAuth(app, baseURL, freshUser.token);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.totalOffers).toBe(0);
    });

    it('should throw notFound if the driver record does not exist', async () => {
      const userWithoutDriver = await createFakeUserWithToken('driver');

      const res = await getWithAuth(app, baseURL, userWithoutDriver.token);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Driver not found/i);
    });

    it('should fail if status query is invalid', async () => {
      const res = await getWithAuth(app, `${baseURL}/?status=invalidStatus`, token);

      expect(res.status).toBe(400);
    });

    it('should fail if user is not a driver', async () => {
      const admin = await createFakeUserWithToken('admin');

      const res = await getWithAuth(app, baseURL, admin.token);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should fail if authorization header is missing', async () => {
      const res = await getWithAuth(app, baseURL);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });
});
