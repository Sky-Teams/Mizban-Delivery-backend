import { eventBus } from '#shared/event-bus/eventBus.js';
import { EVENT_BUS_EVENTS, SOCKET_EVENTS } from '#shared/utils/enums.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { NotificationService } from '#shared/utils/notificationService.js';

export const registerOfferListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.OFFER_ACCEPTED, async (data) => {
    const payload = NotificationPayloads.offerAccepted(data.orderId, data.driverId);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.OFFER_REJECTED, async (data) => {
    const payload = NotificationPayloads.offerAccepted(data.orderId, data.driverId);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });
};
