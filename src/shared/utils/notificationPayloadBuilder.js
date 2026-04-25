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
};
