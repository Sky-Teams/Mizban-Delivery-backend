import { checkBatchForComplete } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { findNearestAndScore } from '#modules/drivers/index.js';
import { getOfferByOrderId } from '#modules/offers/index.js';
import { addDriversDataInOrder } from '#modules/orders/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { DbJobService } from '#shared/utils/dbJob.service.js';
import { LocationService } from '#shared/utils/locationService.js';
import {
  EVENT_BUS_EVENTS,
  ORDER_STATUS,
  REDIS_EVENT_TYPES,
  SOCKET_EVENTS,
} from '#shared/utils/enums.js';
import { EventPublisherService } from '#shared/events/eventPublisherService.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { NotificationService } from '#shared/utils/notificationService.js';
import { OfferService } from '#shared/utils/offerService.js';
import { RouteOptimizationService } from '#shared/utils/routeOptimizationService.js';

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
    // Start driver location tracking
    await LocationService.startDriverTracking(data.userId);

    // Send notification to driver
    const payload = NotificationPayloads.orderAssigned(data.orderId);
    await NotificationService.send('driver', SOCKET_EVENTS.DRIVER.ORDER, payload, data.userId);

    // Cancel the process of sending offer to drivers
    const offer = await getOfferByOrderId(data.orderId);
    if (offer) await DbJobService.cancelOfferTimeout(offer._id);

    // Route optimization
    await RouteOptimizationService.optimizeRoute(data.driverId);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_PICKEDUP, async (data) => {
    // Mark pickup stop as completed
    await RouteOptimizationService.completePickUpStop(data.driverId, data.orderId);

    // Notify Mizban: order pickedUp
    await EventPublisherService.publishOrderEvent({
      type: REDIS_EVENT_TYPES.ORDER_PICKEDUP,
      data,
      status: ORDER_STATUS.PICKEDUP,
      timestamp: data.pickedUpAt,
    });

    const payload = NotificationPayloads.orderPickedUp(
      data.orderId,
      data.driverId,
      data.pickedUpAt
    );

    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_DELIVERED, async (data) => {
    // Mark deliver stop as completed
    await RouteOptimizationService.completeDeliveryStop(data.driverId, data.orderId);

    // Check batch orders completed
    await checkBatchForComplete(data.driverId);

    // Notify Mizban: order delivered
    await EventPublisherService.publishOrderEvent({
      type: REDIS_EVENT_TYPES.ORDER_DELIVERED,
      data,
      status: ORDER_STATUS.DELIVERED,
      timestamp: data.deliveredAt,
    });

    const payload = NotificationPayloads.orderDelivered(
      data.orderId,
      data.driverId,
      data.deliveredAt
    );
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_CANCELLED, async (data) => {
    // If an order cancelled the batch orders updated
    await RouteOptimizationService.cancelledDeliveryBatchOrder(data.driverId, data.orderId);

    const payload = NotificationPayloads.orderCancelled(data.orderId, data.reason);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_RETURNED, async (data) => {
    const payload = NotificationPayloads.orderReturned(data.orderId, data.reason);
    await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.NOTIFICATION, payload);
  });
};
