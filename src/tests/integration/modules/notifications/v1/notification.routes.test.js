import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js';
import {
  connectDB,
  disconnectDB,
  clearDB,
  createFakeUserWithToken,
} from '../../../../config/memoryDB.js';
import { NotificationModel } from '#modules/notifications/models/notification.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '#shared/utils/enums.js';

const baseURL = '/api/notifications/';
let token;
let testUserId;

describe('Notifications API Integration', () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await disconnectDB());

  beforeEach(async () => {
    await clearDB();
    const result = await createFakeUserWithToken();
    testUserId = result.testUserId;
    token = result.token;
  });

  describe('GET /api/notifications', () => {
    it('should return 200 with user notifications', async () => {
      await NotificationModel.create({
        user: testUserId,
        title: 'Test Notification',
      });

      const res = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test Notification');
    });

    it('should return empty array if user has no notifications', async () => {
      const res = await request(app).get(baseURL).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('PATCH /:id/markAsRead', () => {
    let notifId;

    beforeEach(async () => {
      const notif = await NotificationModel.create({
        user: testUserId,
        type: NOTIFICATION_TYPE.SYSTEM,
        title: 'Test Notification',
        isRead: false,
      });
      notifId = notif._id.toString();
    });

    it('should fail validation for invalid ObjectId', async () => {
      const res = await request(app)
        .patch(`${baseURL}invalid-id/markAsRead`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
      expect(res.body.message).toMatch(/Invalid ID format/i);
    });

    it('should mark notification as read successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}${notifId}/markAsRead`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should fail if notification is already read', async () => {
      await NotificationModel.findByIdAndUpdate(notifId, { isRead: true });

      const res = await request(app)
        .patch(`${baseURL}${notifId}/markAsRead`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.ALREADY_MARKED_AS_READ);
      expect(res.body.message).toMatch(/Notification already marked as read/i);
    });

    it('should fail if notification does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`${baseURL}${fakeId}/markAsRead`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.message).toMatch(/Notification not found/i);
    });
  });

  describe('PATCH /:id/markAsUnread', () => {
    let notifId;

    beforeEach(async () => {
      const notif = await NotificationModel.create({
        user: testUserId,
        type: NOTIFICATION_TYPE.SYSTEM,
        title: 'Test Notification',
        isRead: true,
      });
      notifId = notif._id.toString();
    });

    it('should fail validation for invalid ObjectId', async () => {
      const res = await request(app)
        .patch(`${baseURL}123-not-valid/markAsUnread`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_ID);
      expect(res.body.message).toMatch(/Invalid ID format/i);
    });

    it('should mark notification as unread successfully', async () => {
      const res = await request(app)
        .patch(`${baseURL}${notifId}/markAsUnread`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(false);
    });

    it('should fail if notification is already unread', async () => {
      await NotificationModel.findByIdAndUpdate(notifId, { isRead: false });

      const res = await request(app)
        .patch(`${baseURL}${notifId}/markAsUnread`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.ALREADY_MARKED_AS_UNREAD);
      expect(res.body.message).toMatch(/Notification already marked as unread/i);
    });

    it('should fail if notification does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`${baseURL}${fakeId}/markAsUnread`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.message).toMatch(/Notification not found/i);
    });
  });

  describe('Notifications Controller Unauthorized Access', () => {
    let notif;

    beforeEach(async () => {
      notif = await NotificationModel.create({
        user: testUserId,
        title: 'Test Notification',
        type: 'SYSTEM',
        isRead: false,
      });
    });

    it('GET / should throw unauthorized if req.user is missing', async () => {
      const res = await request(app).get(baseURL).set('Authorization', '');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized: Token missing');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });

    it('PATCH /:id/markAsRead should throw unauthorized if req.user is missing', async () => {
      const res = await request(app)
        .patch(`${baseURL}${notif._id}/markAsRead`)
        .set('Authorization', '');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized: Token missing');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });

    it('PATCH /:id/markAsUnread should throw unauthorized if req.user is missing', async () => {
      const res = await request(app)
        .patch(`${baseURL}${notif._id}/markAsUnread`)
        .set('Authorization', '');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized: Token missing');
      expect(res.body.code).toBe(ERROR_CODES.INVALID_JWT);
    });
  });

  describe('Notifications API Integration - Admin Notifications', () => {
    let adminToken, adminId;

    beforeEach(async () => {
      await clearDB();

      // Create two fake admin users
      const admin = await createFakeUserWithToken('admin');
      adminId = admin.testUserId;
      adminToken = admin.token;
    });

    it('should create notifications for all admins', async () => {
      const { createNotificationForAdmins } = await import('#modules/notifications/index.js');

      // Call the service
      await createNotificationForAdmins(NOTIFICATION_TYPE.ORDER, 'New Order', 'Order 123 created');

      // Verify notifications in DB for both admins
      const notifications = await NotificationModel.find({ user: adminId });

      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe(NOTIFICATION_TYPE.ORDER);
      expect(notifications[0].title).toBe('New Order');
      expect(notifications[0].message).toBe('Order 123 created');
    });

    it('admins should retrieve their notifications via API', async () => {
      const { createNotificationForAdmins } = await import('#modules/notifications/index.js');
      await createNotificationForAdmins(NOTIFICATION_TYPE.ORDER, 'New Order', 'Order 123 created');

      const res = await request(app)
        .get('/api/notifications/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('New Order');
    });
  });
});
