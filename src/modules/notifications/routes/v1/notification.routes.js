import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
} from '../../controllers/v1/notification.controller.js';

const router = express.Router();

router.get('/', asyncHandler(getUserNotifications));
router.patch('/:id/markAsRead', asyncHandler(markNotificationAsRead));
router.patch('/:id/markAsUnread', asyncHandler(markNotificationAsUnread));

export default router;
