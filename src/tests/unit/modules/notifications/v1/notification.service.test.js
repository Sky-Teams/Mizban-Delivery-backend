import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationModel } from '#modules/notifications/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import {
  createNotification,
  getNotificationsByUserId,
  markAsRead,
  markAsUnread,
} from '#modules/notifications/index.js';

// Mock only DB layer
vi.mock('#modules/notifications/models/notification.model.js', () => ({
  NotificationModel: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const type = 'system';
      const title = 'Test Title';
      const message = 'Test Message';

      const createdNotification = {
        _id: 'notif123',
        user: userId,
        type,
        title,
        message,
        isRead: false,
      };

      NotificationModel.create.mockResolvedValue(createdNotification);

      const result = await createNotification(userId, type, title, message);

      expect(NotificationModel.create).toHaveBeenCalledWith({
        user: userId,
        type,
        title,
        message,
      });

      expect(result).toEqual(createdNotification);
    });

    it('should throw invalid user id error', async () => {
      await expect(
        createNotification('invalid-id', 'system', 'title', 'message')
      ).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['user'],
            message: ERROR_CODES.INVALID_USER_ID,
          }),
        ]),
      });
    });

    it('should throw invalid notification type error', async () => {
      const validUserId = '507f1f77bcf86cd799439011';
      await expect(
        createNotification(validUserId, 'invalid_type', 'title', 'message')
      ).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['type'],
            message: ERROR_CODES.INVALID_NOTIFICATION_TYPE,
          }),
        ]),
      });
    });

    it('should throw title too long error', async () => {
      const validUserId = '507f1f77bcf86cd799439011';
      const longTitle = 'a'.repeat(101);

      await expect(
        createNotification(validUserId, 'system', longTitle, 'message')
      ).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['title'],
            message: ERROR_CODES.TITLE_TOO_LONG,
          }),
        ]),
      });
    });

    it('should throw message too long error', async () => {
      const validUserId = '507f1f77bcf86cd799439011';
      const longMessage = 'a'.repeat(501);
      await expect(
        createNotification(validUserId, 'system', 'Valid Title', longMessage)
      ).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['message'],
            message: ERROR_CODES.MESSAGE_TOO_LONG,
          }),
        ]),
      });
    });
  });

  describe('getNotificationsByUserId', () => {
    describe('getNotificationsByUserId', () => {
      it('should return sorted notifications (newest first)', async () => {
        const userId = '507f1f77bcf86cd799439011';

        const mockNotifications = [{ _id: '1' }, { _id: '2' }];
        const sortMock = vi.fn().mockResolvedValue(mockNotifications);

        NotificationModel.find.mockReturnValue({
          sort: sortMock,
        });

        const result = await getNotificationsByUserId(userId);

        expect(NotificationModel.find).toHaveBeenCalledWith({ user: userId });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(mockNotifications);
      });

      it('should return an empty array if no notifications exist', async () => {
        const userId = '507f1f77bcf86cd799439011';

        const sortMock = vi.fn().mockResolvedValue([]);
        NotificationModel.find.mockReturnValue({ sort: sortMock });

        const result = await getNotificationsByUserId(userId);

        expect(NotificationModel.find).toHaveBeenCalledWith({ user: userId });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual([]);
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = {
        _id: 'notif1',
        user: 'user1',
        isRead: false,
        save: vi.fn(),
      };

      NotificationModel.findOne.mockResolvedValue(notification);

      const result = await markAsRead('notif1', 'user1');

      expect(notification.isRead).toBe(true);
      expect(notification.save).toHaveBeenCalled();
      expect(result).toEqual(notification);
    });

    it('should throw error if notification not found', async () => {
      NotificationModel.findOne.mockResolvedValue(null);

      await expect(markAsRead('notif1', 'user1')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw error if already read', async () => {
      const notification = {
        isRead: true,
      };

      NotificationModel.findOne.mockResolvedValue(notification);

      await expect(markAsRead('notif1', 'user1')).rejects.toMatchObject({
        message: 'Notification already marked as read',
        code: ERROR_CODES.ALREADY_MARKED_AS_READ,
        status: 400,
      });
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      const notification = {
        _id: 'notif1',
        user: 'user1',
        isRead: true,
        save: vi.fn(),
      };

      NotificationModel.findOne.mockResolvedValue(notification);

      const result = await markAsUnread('notif1', 'user1');

      expect(notification.isRead).toBe(false);
      expect(notification.save).toHaveBeenCalled();
      expect(result).toEqual(notification);
    });

    it('should throw error if notification not found', async () => {
      NotificationModel.findOne.mockResolvedValue(null);

      await expect(markAsUnread('notif1', 'user1')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw error if already unread', async () => {
      const notification = {
        isRead: false,
      };

      NotificationModel.findOne.mockResolvedValue(notification);

      await expect(markAsUnread('notif1', 'user1')).rejects.toMatchObject({
        message: 'Notification already marked as unread',
        code: ERROR_CODES.ALREADY_MARKED_AS_UNREAD,
        status: 400,
      });
    });
  });
});
