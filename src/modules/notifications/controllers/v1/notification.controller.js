import {
  getNotificationsByUserId,
  markAsRead,
  markAsUnread,
} from '../../services/v1/notification.service.js';
import { unauthorized } from '#shared/errors/error.js';

/** Return all notifications of a user */
export const getUserNotifications = async (req, res) => {
  if (!req.user) throw unauthorized;

  const notifications = await getNotificationsByUserId(req.user._id);

  res.status(200).json({ success: true, data: notifications });
};

export const markNotificationAsRead = async (req, res) => {
  if (!req.user) throw unauthorized;

  const updatedNotification = await markAsRead(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: updatedNotification });
};

export const markNotificationAsUnread = async (req, res) => {
  if (!req.user) throw unauthorized;

  const updatedNotification = await markAsUnread(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: updatedNotification });
};
