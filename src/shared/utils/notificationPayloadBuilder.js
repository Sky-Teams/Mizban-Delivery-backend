import { NOTIFICATION_TYPE } from './enums.js';

// All message is created in here and can be used in all listeners
export const NotificationPayloads = {
  orderCreated: (orderId) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'New Order',
    message: `Order ${orderId} has been created`,
  }),

  orderAssigned: (orderId) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'Order Assigned',
    message: `Order ${orderId} has been assigned`,
  }),

  orderOffered: (metadata) => ({
    type: NOTIFICATION_TYPE.OFFER,
    title: 'New Offer',
    message: 'An offer is ready to pickup',
    metadata,
  }),
  noDriverFound: (orderId) => ({
    type: NOTIFICATION_TYPE.NO_DRIVER,
    title: 'No Driver Found',
    message: `No Driver found for order ${orderId}`,
  }),
  systemError: (message) => ({
    type: NOTIFICATION_TYPE.SYSTEM,
    title: 'System Error',
    message,
  }),

  orderPickedUp: (orderId, driverId, pickedUpAt) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'Order pickded Up',
    message: `Order (${orderId}) is pickdedUp by driver (${driverId}) at ${pickedUpAt}`,
  }),

  orderDelivered: (orderId, driverId, deliveredAt) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'Order delivered',
    message: `Order (${orderId}) is deliverd by driver (${driverId}) at ${deliveredAt}`,
  }),

  orderCancelled: (orderId, cancelReason) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'Order cancelled',
    message: `Order (${orderId}) is cancelled. Reason ${cancelReason}`,
  }),

  orderReturned: (orderId, cancelReason) => ({
    type: NOTIFICATION_TYPE.ORDER,
    title: 'Order returned',
    message: `Order (${orderId}) is returned. Reason ${cancelReason}`,
  }),

  offerAccepted: (orderId, driverId) => ({
    type: NOTIFICATION_TYPE.OFFER,
    title: 'Offer Accepted',
    message: `Offer for Order (${orderId}) is accepted by driver (${driverId})`,
  }),

  offerRejected: (orderId, driverId) => ({
    type: NOTIFICATION_TYPE.OFFER,
    title: 'Offer Rejected',
    message: `Offer for Order (${orderId}) is rejected by driver (${driverId})`,
  }),
};
