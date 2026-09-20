import redisClient from '#config/redis.js';
import { EventPublisher } from './EventPublisher.js';

export class RedisEventPublisher extends EventPublisher {
  constructor(channel) {
    super();
    this.channel = channel;
  }

  async publish(event) {
    console.log(event)
    await redisClient.publish(this.channel, JSON.stringify(event));
  }
}
