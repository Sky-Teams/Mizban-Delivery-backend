import { eventBus } from '#shared/event-bus/eventBus.js';
import { RedisEventPublisher } from '#shared/events/RedisEventPublisher.js';
import {
  EVENT_BUS_EVENTS,
  ORDER_STATUS,
  REDIS_CHANNEL,
  REDIS_EVENT_TYPES,
  SERVICE,
} from '#shared/utils/enums.js';

const orderEventPublisher = new RedisEventPublisher(REDIS_CHANNEL.ORDER_EVENTS_CHANNEL);

const publishToMizban = async ({ type, data, status, timestamp }) => {
  if (data.source !== SERVICE.MIZBAN) return;

  try {
    await orderEventPublisher.publish({
      type,
      data: {
        orderId: data.sourceOrderId,
        driverId: data.driverId,
        status,
        updatedAt: timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to publish order event to Mizban:', error);
  }
};

export const registerMizbanListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.ORDER_PICKEDUP, async (data) => {
    await publishToMizban({
      type: REDIS_EVENT_TYPES.ORDER_PICKEDUP,
      data,
      status: ORDER_STATUS.PICKEDUP,
      timestamp: data.pickedUpAt,
    });
  });

  eventBus.on(EVENT_BUS_EVENTS.ORDER_DELIVERED, async (data) => {
    await publishToMizban({
      type: REDIS_EVENT_TYPES.ORDER_DELIVERED,
      data,
      status: ORDER_STATUS.DELIVERED,
      timestamp: data.deliveredAt,
    });
  });
};
