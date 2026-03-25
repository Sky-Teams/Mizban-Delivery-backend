import { CustomSocket } from '#config/socket.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { createNotificationForAdmins } from '../services/v1/notification.service.js';

export const registerOrderListeners = () => {
  eventBus.on('order:created', async (data) => {
    const payload = NotificationPayloads.orderCreated(data.orderId);
    CustomSocket.emitToAdmins('notification', payload);

    console.log('Count', CustomSocket.getOnlineUserCount());

    await createNotificationForAdmins(payload.type, payload.title, payload.message);
  });
};
