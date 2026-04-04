import { CustomSocket } from '#config/socket.js';
import { findNearestAndScore } from '#modules/drivers/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { OfferService } from '#shared/utils/offerService.js';
import { createNotificationForAdmins } from '../services/v1/notification.service.js';

export const registerOrderListeners = () => {
  eventBus.on('order:created', async (data) => {
    const orderId = data.orderId.toString();
    //TODO We should create a centralized notification service for sending notification
    const payload = NotificationPayloads.orderCreated(orderId);
    CustomSocket.emitToAdmins('notification', payload);
    await createNotificationForAdmins(payload.type, payload.title, payload.message);

    const drivers = await findNearestAndScore(data.newOrder.pickupLocation.coordinates);

    // TODO we must search what should we do if no driver found. for now we just send an notification for all admins
    if (!drivers.length) {
      const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
      CustomSocket.emitToAdmins('no-driver', noDriverFoundPayload);
      await createNotificationForAdmins(
        noDriverFoundPayload.type,
        noDriverFoundPayload.title,
        noDriverFoundPayload.message
      );
      return;
    }

    await OfferService.sendOfferToDriver(orderId, drivers, 0);
  });
};
