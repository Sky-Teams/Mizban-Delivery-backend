import { REDIS_CHANNEL, SERVICE } from '#shared/utils/enums.js';
import { RedisEventPublisher } from './RedisEventPublisher.js';

const orderEventPublisher = new RedisEventPublisher(REDIS_CHANNEL.ORDER_EVENTS_CHANNEL);

export class EventPublisherService {
  static async publishOrderEvent({ type, data, status, timestamp }) {
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
  }
}
