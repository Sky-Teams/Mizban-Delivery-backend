export const ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
};

export const OFFER_STATUS = {
  PENDING: 'pending',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
};

export const ORDER_STATUS = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  PICKEDUP: 'pickedUp',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  IDLE: 'idle',
  ASSIGNED: 'assigned',
  DELIVERING: 'delivering',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
};

export const CUSTOM_EVENTS = {
  ORDER_CREATED: 'order:created',
};
