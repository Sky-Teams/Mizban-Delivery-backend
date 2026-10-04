import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { registerMizbanListeners } from '#modules/notifications/listeners/mizban.listeners.js';
import {
  EVENT_BUS_EVENTS,
  ORDER_STATUS,
  REDIS_CHANNEL,
  REDIS_EVENT_TYPES,
  SERVICE,
} from '#shared/utils/enums.js';

const { publishMock, publisherChannels } = vi.hoisted(() => ({
  publishMock: vi.fn(),
  publisherChannels: [],
}));

// The publisher is created at module load, before beforeEach clears the mocks, so record its channel here
vi.mock('#shared/events/RedisEventPublisher.js', () => ({
  RedisEventPublisher: vi.fn(function (channel) {
    publisherChannels.push(channel);
    return {
      publish: publishMock,
    };
  }),
}));

// eventBus.emit does not wait for async handlers, so we call the registered handler directly and await it
const runHandler = async (event, data) => {
  const [handler] = eventBus.listeners(event);
  await handler(data);
};

describe('Mizban listeners', () => {
  const pickedUpAt = new Date('2026-10-01T10:00:00.000Z');
  const deliveredAt = new Date('2026-10-01T10:30:00.000Z');

  const basePayload = {
    orderId: 'order-123',
    driverId: 'driver-123',
    source: SERVICE.MIZBAN,
    sourceOrderId: 'mizban-order-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners();
    registerMizbanListeners();
  });

  it('should create the publisher with the order events channel', () => {
    expect(publisherChannels).toEqual([REDIS_CHANNEL.ORDER_EVENTS_CHANNEL]);
  });

  it('should register handlers for ORDER_PICKEDUP and ORDER_DELIVERED', () => {
    expect(eventBus.listenerCount(EVENT_BUS_EVENTS.ORDER_PICKEDUP)).toBe(1);
    expect(eventBus.listenerCount(EVENT_BUS_EVENTS.ORDER_DELIVERED)).toBe(1);
  });

  it('should publish pickedUp event for mizban order', async () => {
    await runHandler(EVENT_BUS_EVENTS.ORDER_PICKEDUP, { ...basePayload, pickedUpAt });

    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledWith({
      type: REDIS_EVENT_TYPES.ORDER_PICKEDUP,
      data: {
        orderId: 'mizban-order-123',
        driverId: 'driver-123',
        status: ORDER_STATUS.PICKEDUP,
        updatedAt: pickedUpAt,
      },
    });
  });

  it('should publish delivered event for mizban order', async () => {
    await runHandler(EVENT_BUS_EVENTS.ORDER_DELIVERED, { ...basePayload, deliveredAt });

    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledWith({
      type: REDIS_EVENT_TYPES.ORDER_DELIVERED,
      data: {
        orderId: 'mizban-order-123',
        driverId: 'driver-123',
        status: ORDER_STATUS.DELIVERED,
        updatedAt: deliveredAt,
      },
    });
  });

  it('should not publish pickedUp event for non-mizban order', async () => {
    await runHandler(EVENT_BUS_EVENTS.ORDER_PICKEDUP, {
      ...basePayload,
      source: undefined,
      sourceOrderId: undefined,
      pickedUpAt,
    });

    expect(publishMock).not.toHaveBeenCalled();
  });

  it('should not publish delivered event for non-mizban order', async () => {
    await runHandler(EVENT_BUS_EVENTS.ORDER_DELIVERED, {
      ...basePayload,
      source: undefined,
      sourceOrderId: undefined,
      deliveredAt,
    });

    expect(publishMock).not.toHaveBeenCalled();
  });

  it('should log and not throw when publishing fails', async () => {
    const error = new Error('Redis down');
    publishMock.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      runHandler(EVENT_BUS_EVENTS.ORDER_DELIVERED, { ...basePayload, deliveredAt })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to publish order event to Mizban:', error);

    consoleSpy.mockRestore();
  });
});
