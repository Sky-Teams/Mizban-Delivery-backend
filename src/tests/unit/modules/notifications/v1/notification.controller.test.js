import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
} from '#modules/notifications/controllers/v1/notification.controller.js';
import {
  getNotificationsByUserId,
  markAsRead,
  markAsUnread,
} from '#modules/notifications/services/v1/notification.service.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

// Mock the service layer
vi.mock('#modules/notifications/services/v1/notification.service.js', () => ({
  getNotificationsByUserId: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
}));

describe('Notification Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: '507f1f77bcf86cd799439011' },
      params: { id: '507f1f77bcf86cd799439022' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getUserNotifications', () => {
    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(getUserNotifications(req, res)).rejects.toMatchObject({
        message: 'User is not authorized',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('should return notifications with 200', async () => {
      const mockNotifications = [{ _id: 'notif1' }, { _id: 'notif2' }];
      getNotificationsByUserId.mockResolvedValue(mockNotifications);

      await getUserNotifications(req, res);

      expect(getNotificationsByUserId).toHaveBeenCalledWith(req.user._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
      });
    });

    it('should return empty array if no notifications exist', async () => {
      getNotificationsByUserId.mockResolvedValue([]);

      await getUserNotifications(req, res);

      expect(getNotificationsByUserId).toHaveBeenCalledWith(req.user._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('markNotificationAsRead', () => {
    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(markNotificationAsRead(req, res)).rejects.toMatchObject({
        message: 'User is not authorized',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('should mark notification as read and return 200', async () => {
      const mockNotification = { _id: req.params.id, isRead: true };
      markAsRead.mockResolvedValue(mockNotification);

      await markNotificationAsRead(req, res);

      expect(markAsRead).toHaveBeenCalledWith(req.params.id, req.user._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('should propagate error from markAsRead', async () => {
      const error = new AppError('Already read', 400, ERROR_CODES.ALREADY_MARKED_AS_READ);
      markAsRead.mockRejectedValue(error);

      await expect(markNotificationAsRead(req, res)).rejects.toThrow(AppError);
      await expect(markNotificationAsRead(req, res)).rejects.toMatchObject({
        message: 'Already read',
        code: ERROR_CODES.ALREADY_MARKED_AS_READ,
      });
    });
  });

  describe('markNotificationAsUnread', () => {
    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(markNotificationAsUnread(req, res)).rejects.toMatchObject({
        message: 'User is not authorized',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('should mark notification as unread and return 200', async () => {
      const mockNotification = { _id: req.params.id, isRead: false };
      markAsUnread.mockResolvedValue(mockNotification);

      await markNotificationAsUnread(req, res);

      expect(markAsUnread).toHaveBeenCalledWith(req.params.id, req.user._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('should propagate error from markAsUnread', async () => {
      const error = new AppError('Already unread', 400, ERROR_CODES.ALREADY_MARKED_AS_UNREAD);
      markAsUnread.mockRejectedValue(error);

      await expect(markNotificationAsUnread(req, res)).rejects.toThrow(AppError);
      await expect(markNotificationAsUnread(req, res)).rejects.toMatchObject({
        message: 'Already unread',
        code: ERROR_CODES.ALREADY_MARKED_AS_UNREAD,
      });
    });
  });
});
