import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
} from '../../controllers/v1/notification.controller.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';

const router = express.Router();

router.get('/', asyncHandler(getUserNotifications));
router.patch('/:id/markAsRead', validate(mongoIdValidator), asyncHandler(markNotificationAsRead));
router.patch(
  '/:id/markAsUnread',
  validate(mongoIdValidator),
  asyncHandler(markNotificationAsUnread)
);

export default router;
