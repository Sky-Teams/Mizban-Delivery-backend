export { default as notificationRoutes } from './routes/v1/notification.routes.js';
export { NotificationModel } from './models/notification.model.js';
export {
  createNotification,
  getNotificationsByUserId,
  markAsRead,
  markAsUnread,
  createNotificationForAdmins,
} from './services/v1/notification.service.js';
