import { findNearestAndScore } from '#modules/drivers/index.js';
import { getOfferByOrderId } from '#modules/offers/index.js';
import { addDriversDataInOrder } from '#modules/orders/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { DbJobService } from '#shared/utils/dbJob.service.js';
import { EVENT_BUS_EVENTS, SOCKET_EVENTS } from '#shared/utils/enums.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { NotificationService } from '#shared/utils/notificationService.js';
import { OfferService } from '#shared/utils/offerService.js';

export const registerOrderListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.ORDER_CREATED, async (data) => {
    const orderId = data.orderId.toString();

    const payload = NotificationPayloads.orderCreated(orderId);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);

    const drivers = await findNearestAndScore(data.pickupLocation.coordinates);

    await addDriversDataInOrder(orderId, drivers);
    await OfferService.sendOfferToDriver(orderId);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_ASSIGNED, async (data) => {
    // Send notification to driver
    const payload = NotificationPayloads.orderAssigned(data.orderId);
    await NotificationService.send('driver', SOCKET_EVENTS.DRIVER.ORDER, payload, data.userId);

    // Cancel the process of sending offer to drivers
    const offer = await getOfferByOrderId(data.orderId);
    await DbJobService.cancelOfferTimeout(offer._id);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_PICKEDUP, async (data) => {
    const payload = NotificationPayloads.orderPickedUp(
      data.orderId,
      data.driverId,
      data.pickedUpAt
    );

    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_DELIVERED, async (data) => {
    const payload = NotificationPayloads.orderDelivered(
      data.orderId,
      data.driverId,
      data.deliveredAt
    );
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_CANCELLED, async (data) => {
    const payload = NotificationPayloads.orderCancelled(data.orderId, data.reason);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_RETURNED, async (data) => {
    const payload = NotificationPayloads.orderReturned(data.orderId, data.reason);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });
};
