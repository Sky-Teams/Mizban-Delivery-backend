// All message is created in here and can be used in all listeners
export const NotificationPayloads = {
  orderCreated: (orderId) => ({
    type: 'ORDER',
    title: 'New Order',
    message: `Order ${orderId} has been created`,
  }),

  orderAssigned: (orderId) => ({
    type: 'ORDER',
    title: 'Order Assigned',
    message: `Order ${orderId} has been assigned`,
  }),

  orderOffered: () => ({
    type: 'OFFER',
    title: 'New Offer',
    message: 'An offer is ready to pickup',
  }),
  noDriverFound: (orderId) => ({
    type: 'NO-DRIVER',
    title: 'No Driver Found',
    message: `No Driver found for order ${orderId}`,
  }),
};
