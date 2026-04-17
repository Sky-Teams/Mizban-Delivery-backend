import { CustomSocket } from '#config/socket.js';
import { findNearestAndScore } from '#modules/drivers/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { OfferService } from '#shared/utils/offerService.js';
import { createNotificationForAdmins } from '../services/v1/notification.service.js';
import { pushNotification } from '#modules/notifications/services/pushNotification/pushNotification.js';

export const registerOrderListeners = () => {
  eventBus.on('order:created', async (data) => {
    const orderId = data.orderId.toString();
    //TODO We should create a centralized notification service for sending notification
    const payload = NotificationPayloads.orderCreated(orderId);
    CustomSocket.emitToAdmins('notification', payload);
    await createNotificationForAdmins(payload.type, payload.title, payload.message);

    // checking if admin is online or not
    const admins = await getAllAdmins();

    for (const admin of admins) {
      const adminId = admin._id.toString();

      const isOnline = CustomSocket.isUserOnline(adminId);

      if (!isOnline && admin.fcmToken) {
        await pushNotification(admin.fcmToken, {
          title: payload.title,
          message: payload.message,
          data: {
            type: payload.type,
            orderId,
          }
        });
      }
    }

    const drivers = await findNearestAndScore(data.newOrder.pickupLocation.coordinates);

    await OfferService.sendOfferToDriver(orderId, drivers, 0);
  });
};
