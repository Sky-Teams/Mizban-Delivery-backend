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
};
