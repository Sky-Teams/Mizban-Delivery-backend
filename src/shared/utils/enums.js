export const ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
};

export const OFFER_STATUS = {
  PENDING: 'pending',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
};

export const ORDER_STATUS = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  PICKEDUP: 'pickedUp',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
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

// Event-bus events
export const EVENT_BUS_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_ASSIGNED: 'order:assigned',
  ORDER_PICKEDUP: 'order:pickedUp',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_RETURNED: 'order:returned',
  OFFER_ACCEPTED: 'offer:accepted',
  OFFER_REJECTED: 'offer:rejected',
};

export const VEHICLE_TYPE = {
  MOTORBIKE: 'motorbike',
};

export const NOTIFICATION_TYPE = {
  SYSTEM: 'SYSTEM',
  ORDER: 'ORDER',
  OFFER: 'OFFER',
  NO_DRIVER: 'NO_DRIVER',
  PAYMENT: 'PAYMENT',
};

// Socket events (events that is emitted to frontend)
export const SOCKET_EVENTS = {
  ADMIN: {
    NOTIFICATION: 'notification',
    NO_DRIVER: 'no_driver',
    SYSTEM: 'system',
  },
  DRIVER: {
    OFFER: 'offer',
    ORDER: 'order',
  },
};

export const DEVICES = {
  WEB: 'web',
  ANDROID: 'android',
  IOS: 'ios',
};

export const FUEL_TYPE = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const REASON_TYPES = {
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};
