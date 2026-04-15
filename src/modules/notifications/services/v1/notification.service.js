import { NotificationModel } from '../../models/notification.model.js';
import { createNotificationSchema } from '../../dto/create-notification.schema.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { getAllAdmins } from '#modules/users/index.js';
import admin from "../../../../config/firebase/firebaseAdmin.js";
import { CustomSocket } from "../../../../config/socket.js";
import { UserModel } from "../../../../modules/users/models/user.model.js";


/**
 * Create a new notification in the system.
 * This function is intended to be used internally by other services,
 * not via an API route, so validation is performed here in the service layer.
 */

export const createNotification = async (userId, type, title, message) => {
  const notification = { user: userId, type, title, message };
  const validatedNotification = createNotificationSchema.parse(notification);

  const newNotification = await NotificationModel.create(validatedNotification);
  
  const isOnline = CustomSocket.isUserOnline(userId.toString())

  if(isOnline) {
    CustomSocket.emitToUser(userId.toString(), "notification", {
      type, title, message
    })
  } else {
    const user = await UserModel.findById(userId)

    if(user?.fcmToken) {
      try{
        await admin.messaging().send({
          token: user.fcmToken,
          notification: {
            title, 
            body: message,
          }
        })
      } catch (err) {
        console.error("FCM Error:", err.message)
      }
    }
  }

  return newNotification;
};

/** Get notifications by user ID */
export const getNotificationsByUserId = async (userId) => {
  // Sort from newest to oldest
  const notifications = await NotificationModel.find({ user: userId }).sort({ createdAt: -1 });
  return notifications;
};

/** Mark notification as read. */
export const markAsRead = async (notificationId, userId) => {
  const notification = await NotificationModel.findOne({ _id: notificationId, user: userId });

  if (!notification) throw notFound('Notification');

  if (notification.isRead)
    throw new AppError(
      'Notification already marked as read',
      400,
      ERROR_CODES.ALREADY_MARKED_AS_READ
    );

  notification.isRead = true;
  await notification.save();
  return notification;
};

/** Mark notification as unread. */
export const markAsUnread = async (notificationId, userId) => {
  const notification = await NotificationModel.findOne({ _id: notificationId, user: userId });

  if (!notification) throw notFound('Notification');

  if (!notification.isRead)
    throw new AppError(
      'Notification already marked as unread',
      400,
      ERROR_CODES.ALREADY_MARKED_AS_UNREAD
    );

  notification.isRead = false;
  await notification.save();
  return notification;
};

export const createNotificationForAdmins = async (type, title, message) => {
  const admins = await getAllAdmins();

  const notifications = admins.map((admin) => ({
    user: admin._id.toString(),
    type,
    title,
    message,
  }));

  await NotificationModel.insertMany(notifications);
};
