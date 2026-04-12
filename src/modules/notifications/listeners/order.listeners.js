import { findNearestAndScore } from '#modules/drivers/index.js';
import { addDriversDataInOrder } from '#modules/orders/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { NotificationService } from '#shared/utils/notificationService.js';
import { OfferService } from '#shared/utils/offerService.js';

export const registerOrderListeners = () => {
  eventBus.on('order:created', async (data) => {
    const orderId = data.orderId.toString();
    //TODO We should create a centralized notification service for sending notification
    const payload = NotificationPayloads.orderCreated(orderId);
    await NotificationService.send('admins', 'notification', payload);

    const drivers = await findNearestAndScore(data.newOrder.pickupLocation.coordinates);

    await addDriversDataInOrder(orderId, drivers);
    await OfferService.sendOfferToDriver(orderId);
  });
};
