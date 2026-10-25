import { eventBus } from '#shared/event-bus/eventBus.js';
import { RedisEventPublisher } from '#shared/events/RedisEventPublisher.js';
import {
  EVENT_BUS_EVENTS,
  REDIS_CHANNEL,
  REDIS_EVENT_TYPE,
  SERVICE,
  SOCKET_EVENTS,
} from '#shared/utils/enums.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { NotificationService } from '#shared/utils/notificationService.js';

const offerPublisher = new RedisEventPublisher(REDIS_CHANNEL.ORDER_OFFER_CHANNEL);

export const registerOfferListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.OFFER_ACCEPTED, async (data) => {
    const payload = NotificationPayloads.offerAccepted(data.orderId, data.driverId);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);

    if (data.source === SERVICE.MIZBAN) {
      await offerPublisher.publish({
        type: REDIS_EVENT_TYPE.OFFER_ACCEPTED,
        data: {
          orderId: data.sourceOrderId,
          driver: {
            driverId: driver._id.toString(),
            fullname: driver.user.name,
            phone: driver.user.phone,
          },
        },
      });
    }
  });

  eventBus.on(EVENT_BUS_EVENTS.OFFER_REJECTED, async (data) => {
    const payload = NotificationPayloads.offerRejected(data.orderId, data.driverId);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });
};
