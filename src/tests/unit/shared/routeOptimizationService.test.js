import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { driverActiveBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { isLocationFresh } from '#shared/utils/batch.helper.js';
import { BATCH_STATUS, STOP_STATUS, STOP_TYPE } from '#shared/utils/enums.js';
import { RedisService } from '#shared/utils/redisLocationService.js';
import { RouteOptimizationService } from '#shared/utils/routeOptimizationService.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#modules/deliveryBatch/model/delivery.batch.model.js', () => ({
  DeliveryBatchModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#shared/utils/batch.helper.js', () => ({
  isLocationFresh: vi.fn(),
}));

vi.mock('#modules/deliveryBatch/services/v1/delivery.batch.service.js', () => ({
  driverActiveBatch: vi.fn(),
}));

vi.mock('#shared/utils/redisLocationService.js', () => ({
  RedisService: {
    getRedisData: vi.fn(),
  },
}));

vi.mock('#modules/deliveryBatch/model/delivery.batch.model.js', () => ({
  DeliveryBatchModel: {
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

//=============== completePickUpStop ==========
describe('completePickUpStop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark the pickup stop as completed', async () => {
    const updatedBatch = {
      _id: 'batch-1',
      driver: 'driver-1',
    };

    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(updatedBatch);

    const result = await RouteOptimizationService.completePickUpStop('driver-1', 'order-1');

    expect(DeliveryBatchModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        driver: 'driver-1',
        status: BATCH_STATUS.ACTIVE,
      },
      {
        $set: {
          'stops.$[stop].stopStatus': STOP_STATUS.COMPLETED,
        },
      },
      {
        arrayFilters: [
          {
            'stop.orderId': 'order-1',
            'stop.stopType': STOP_TYPE.PICKUP,
            'stop.stopStatus': STOP_STATUS.PENDING,
          },
        ],
        returnDocument: 'after',
      }
    );

    expect(result).toEqual(updatedBatch);
  });

  it('should handle when the active batch or pending delivery stop is not found', async () => {
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(null);

    const result = await RouteOptimizationService.completePickUpStop('driver-1', 'order-2');

    expect(result).toBeUndefined();
  });
});

//================ completeDeliveryStop========
describe('completeDeliveryStop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark the delivery stop as completed', async () => {
    const updatedBatch = {
      _id: 'batch-1',
      driver: 'driver-1',
    };

    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(updatedBatch);

    const result = await RouteOptimizationService.completeDeliveryStop('driver-1', 'order-1');

    expect(DeliveryBatchModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        driver: 'driver-1',
        status: BATCH_STATUS.ACTIVE,
      },
      {
        $set: {
          'stops.$[stop].stopStatus': STOP_STATUS.COMPLETED,
        },
      },
      {
        arrayFilters: [
          {
            'stop.orderId': 'order-1',
            'stop.stopType': STOP_TYPE.DELIVERY,
            'stop.stopStatus': STOP_STATUS.PENDING,
          },
        ],
        returnDocument: 'after',
      }
    );

    expect(result).toEqual(updatedBatch);
  });

  it('should handle when the active batch or pending delivery stop is not found', async () => {
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(null);

    const result = await RouteOptimizationService.completeDeliveryStop('driver-1', 'order-2');

    expect(result).toBeUndefined();
  });
});

//================= buildRoute =================
describe('buildRoute', () => {
  const createStop = (orderId, stopType, coordinates) => ({
    orderId,
    stopType,
    stopStatus: STOP_STATUS.PENDING,
    location: {
      coordinates,
    },
  });

  it('should return null when stops is empty', () => {
    expect(RouteOptimizationService.buildRoute([], [0, 0])).toBeNull();
  });

  it('should return null when current location is invalid', () => {
    const stops = [
      {
        orderId: 'order-1',
        stopType: STOP_TYPE.PICKUP,
        location: { coordinates: [1, 1] },
      },
    ];

    expect(RouteOptimizationService.buildRoute(stops, [NaN, 0])).toBeNull();
  });

  it('should return null when stops is not an array', () => {
    expect(RouteOptimizationService.buildRoute(null, [0, 0])).toBeNull();
  });

  it('should return null when current location is invalid', () => {
    const stops = [createStop('order-1', STOP_TYPE.PICKUP, [1, 1])];

    expect(RouteOptimizationService.buildRoute(stops, [NaN, 0])).toBeNull();
    expect(RouteOptimizationService.buildRoute(stops, [0])).toBeNull();
    expect(RouteOptimizationService.buildRoute(stops, null)).toBeNull();
  });

  it('should return an empty route when no stops are eligible', () => {
    const stops = [
      {
        orderId: 'order-1',
        stopType: STOP_TYPE.DELIVERY,
        location: { coordinates: [1, 1] },
      },
    ];

    const result = RouteOptimizationService.buildRoute(stops, [0, 0]);

    expect(result).toEqual([]);
  });

  it('should pick up an order before delivering it', () => {
    const pickupStop = createStop('order-1', STOP_TYPE.PICKUP, [1, 1]);
    const deliveryStop = createStop('order-1', STOP_TYPE.DELIVERY, [2, 2]);

    const result = RouteOptimizationService.buildRoute([deliveryStop, pickupStop], [0, 0]);

    expect(result).toHaveLength(2);
    expect(result[0].stopType).toBe(STOP_TYPE.PICKUP);
    expect(result[1].stopType).toBe(STOP_TYPE.DELIVERY);
  });

  it('should build an optimized route when all stops are valid', () => {
    const pickupStop = createStop('order-1', STOP_TYPE.PICKUP, [1, 1]);
    const deliveryStop = createStop('order-1', STOP_TYPE.DELIVERY, [2, 2]);

    const result = RouteOptimizationService.buildRoute([deliveryStop, pickupStop], [0, 0]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(pickupStop);
    expect(result[1]).toEqual(deliveryStop);
  });
});

//================ optimizeRoute ===============
describe('optimizeRoute', () => {
  const driverId = 'driver-1';

  const pickupStop = {
    orderId: 'order-1',
    stopType: STOP_TYPE.PICKUP,
    stopStatus: STOP_STATUS.PENDING,
    location: { coordinates: [1, 1] },
  };

  const deliveryStop = {
    orderId: 'order-1',
    stopType: STOP_TYPE.DELIVERY,
    stopStatus: STOP_STATUS.PENDING,
    location: { coordinates: [2, 2] },
  };

  const activeBatch = {
    _id: 'batch-1',
    driver: driverId,
    status: BATCH_STATUS.ACTIVE,
    stops: [pickupStop, deliveryStop],
  };

  let createStopSpy;
  let validateStopsSpy;
  let buildRouteSpy;
  let validateRouteOrderSpy;

  beforeEach(() => {
    vi.clearAllMocks();

    createStopSpy = vi.spyOn(RouteOptimizationService, 'createStop');
    validateStopsSpy = vi.spyOn(RouteOptimizationService, 'validateStops');
    buildRouteSpy = vi.spyOn(RouteOptimizationService, 'buildRoute');
    validateRouteOrderSpy = vi.spyOn(RouteOptimizationService, 'validateRouteOrder');
    driverActiveBatch.mockResolvedValue(activeBatch);
    RedisService.getRedisData.mockResolvedValue({ lng: 0, lat: 0 });
    isLocationFresh.mockResolvedValue(true);

    createStopSpy.mockResolvedValue([]);
    validateStopsSpy.mockReturnValue(true);
    buildRouteSpy.mockReturnValue([pickupStop, deliveryStop]);
    validateRouteOrderSpy.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should optimize the route and update the active batch', async () => {
    const updatedBatch = {
      ...activeBatch,
      stops: [pickupStop, deliveryStop],
    };

    DeliveryBatchModel.findByIdAndUpdate.mockResolvedValue(updatedBatch);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(buildRouteSpy).toHaveBeenCalledWith([pickupStop, deliveryStop], [0, 0], []);

    expect(validateRouteOrderSpy).toHaveBeenCalledWith([pickupStop, deliveryStop], []);

    expect(DeliveryBatchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      activeBatch._id,
      {
        $set: {
          stops: [pickupStop, deliveryStop],
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    expect(result).toEqual(updatedBatch);
  });

  it('should handle when the active batch is not found', async () => {
    driverActiveBatch.mockResolvedValue(null);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should return undefined when the driver location is missing', async () => {
    RedisService.getRedisData.mockResolvedValue(null);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
  });

  it('should return undefined when the driver location has invalid coordinates', async () => {
    RedisService.getRedisData.mockResolvedValue({
      lng: 'invalid',
      lat: 0,
    });

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
  });

  it('should return undefined when the driver location is stale', async () => {
    isLocationFresh.mockResolvedValue(false);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(createStopSpy).not.toHaveBeenCalled();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should return undefined when there are no stops', async () => {
    createStopSpy.mockResolvedValue([]);
    driverActiveBatch.mockResolvedValue({
      ...activeBatch,
      stops: [],
    });

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should handle invalid stops', async () => {
    validateStopsSpy.mockReturnValue(false);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should return undefined when the route is null', async () => {
    buildRouteSpy.mockReturnValue(null);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should handle an invalid optimized route', async () => {
    validateRouteOrderSpy.mockReturnValue(false);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(result).toBeUndefined();
    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should keep completed stops before the optimized pending route', async () => {
    const completedPickup = {
      ...pickupStop,
      stopStatus: STOP_STATUS.COMPLETED,
    };

    const pendingDelivery = {
      ...deliveryStop,
      stopStatus: STOP_STATUS.PENDING,
    };

    driverActiveBatch.mockResolvedValue({
      ...activeBatch,
      stops: [completedPickup, pendingDelivery],
    });

    buildRouteSpy.mockReturnValue([pendingDelivery]);

    const updatedBatch = {
      ...activeBatch,
      stops: [completedPickup, pendingDelivery],
    };

    DeliveryBatchModel.findByIdAndUpdate.mockResolvedValue(updatedBatch);

    const result = await RouteOptimizationService.optimizeRoute(driverId);

    expect(buildRouteSpy).toHaveBeenCalledWith([pendingDelivery], [0, 0], ['order-1']);

    expect(DeliveryBatchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      activeBatch._id,
      {
        $set: {
          stops: [completedPickup, pendingDelivery],
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    expect(result).toEqual(updatedBatch);
  });
});

//================ cancelledOrReturnedDeliveryBatchOrder =======
describe('cancelledOrReturnedDeliveryBatchOrder', () => {
  const driverId = 'driver-1';
  const orderId = 'order-1';

  const activeBatch = {
    _id: 'batch-1',
    driver: driverId,
    orderIds: ['order-1', 'order-2'],
    stops: [
      { orderId: 'order-1', stopType: STOP_TYPE.PICKUP },
      { orderId: 'order-1', stopType: STOP_TYPE.DELIVERY },
      { orderId: 'order-2', stopType: STOP_TYPE.PICKUP },
      { orderId: 'order-2', stopType: STOP_TYPE.DELIVERY },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    driverActiveBatch.mockResolvedValue(activeBatch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove the cancelled order and its stops from the batch', async () => {
    DeliveryBatchModel.findByIdAndUpdate.mockResolvedValue({});

    await RouteOptimizationService.cancelledOrReturnedDeliveryBatchOrder(driverId, orderId);

    expect(DeliveryBatchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      activeBatch._id,
      {
        $set: {
          orderIds: ['order-2'],
          stops: [
            { orderId: 'order-2', stopType: STOP_TYPE.PICKUP },
            { orderId: 'order-2', stopType: STOP_TYPE.DELIVERY },
          ],
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
  });

  it('should not optimize the route when no orders remain in the batch', async () => {
    driverActiveBatch.mockResolvedValue({
      ...activeBatch,
      orderIds: ['order-1'],
      stops: [
        { orderId: 'order-1', stopType: STOP_TYPE.PICKUP },
        { orderId: 'order-1', stopType: STOP_TYPE.DELIVERY },
      ],
    });

    DeliveryBatchModel.findByIdAndUpdate.mockResolvedValue({});

    await RouteOptimizationService.cancelledOrReturnedDeliveryBatchOrder(driverId, orderId);

    expect(DeliveryBatchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      activeBatch._id,
      {
        $set: {
          orderIds: [],
          stops: [],
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
  });

  it('should not update the batch when no active batch exists', async () => {
    driverActiveBatch.mockResolvedValue(null);

    await RouteOptimizationService.cancelledOrReturnedDeliveryBatchOrder(driverId, orderId);

    expect(DeliveryBatchModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
