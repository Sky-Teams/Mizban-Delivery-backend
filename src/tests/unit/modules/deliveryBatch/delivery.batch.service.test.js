import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { OrderModel } from '#modules/orders/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import {
  isBatchSizeAvailable,
  isDeliveryCompatible,
  isPickupCompatible,
  isPreparationCompatible,
} from '#shared/utils/batch.helper.js';
import { BATCH_STATUS, ORDER_STATUS } from '#shared/utils/enums.js';
import {
  canAddNewOrder,
  driverActiveBatch,
  isBatchComplete,
  orderAssignedForBatching,
} from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { getOrdersByIds, getOrderById } from '#modules/orders/services/v1/order.service.js';

vi.mock('#modules/deliveryBatch/model/delivery.batch.model.js', () => ({
  DeliveryBatchModel: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('#modules/orders/index.js', () => ({
  OrderModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#modules/orders/services/v1/order.service.js', () => ({
  getOrderById: vi.fn(),
  getOrdersByIds: vi.fn(),
}));

vi.mock('#shared/utils/batch.helper.js', () => ({
  isBatchSizeAvailable: vi.fn(),
  isDeliveryCompatible: vi.fn(),
  isPickupCompatible: vi.fn(),
  isPreparationCompatible: vi.fn(),
}));

const makeOrder = (overrides = {}) => ({
  _id: 'order-1',
  status: ORDER_STATUS.PREPARING,
  ...overrides,
});

const makeBatch = (overrides = {}) => ({
  _id: 'batch-1',
  driver: 'driver-1',
  orderIds: ['order-1'],
  status: BATCH_STATUS.ACTIVE,
  ...overrides,
});

describe('driverActiveBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the active batch for a driver', async () => {
    const batch = makeBatch();

    DeliveryBatchModel.findOne.mockResolvedValue(batch);

    const result = await driverActiveBatch('driver-1');

    expect(DeliveryBatchModel.findOne).toHaveBeenCalledWith({
      driver: 'driver-1',
      status: BATCH_STATUS.ACTIVE,
    });
    expect(result).toBe(batch);
  });

  it('should return null when the driver has no active batch', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(null);

    const result = await driverActiveBatch('driver-1');

    expect(result).toBeNull();
  });
});

describe('canAddNewOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getOrdersByIds.mockResolvedValue([makeOrder()]);
    getOrderById.mockResolvedValue(makeOrder({ _id: 'order-2' }));

    isPickupCompatible.mockReturnValue(true);
    isDeliveryCompatible.mockReturnValue(true);
    isPreparationCompatible.mockReturnValue(true);
  });

  it('should return true when all orders are compatible', async () => {
    const result = await canAddNewOrder(makeBatch(), 'order-2');

    expect(getOrdersByIds).toHaveBeenCalledWith(['order-1']);
    expect(getOrderById).toHaveBeenCalledWith('order-2');
    expect(result).toBe(true);
  });

  it('should skip delivered and cancelled orders', async () => {
    getOrdersByIds.mockResolvedValue([
      makeOrder({ status: ORDER_STATUS.DELIVERED }),
      makeOrder({
        _id: 'order-3',
        status: ORDER_STATUS.CANCELLED,
      }),
    ]);

    const result = await canAddNewOrder(makeBatch(), 'order-2');

    expect(isPickupCompatible).not.toHaveBeenCalled();
    expect(isDeliveryCompatible).not.toHaveBeenCalled();
    expect(isPreparationCompatible).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should throw when pickup is incompatible', async () => {
    isPickupCompatible.mockReturnValue(false);

    await expect(canAddNewOrder(makeBatch(), 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.BATCH_PICKUP_NOT_COMPATIBLE,
    });
  });

  it('should return false when pickup is incompatible and throwOnError is false', async () => {
    isPickupCompatible.mockReturnValue(false);

    const result = await canAddNewOrder(makeBatch(), 'order-2', {
      throwOnError: false,
    });

    expect(result).toBe(false);
  });

  it('should throw when delivery is incompatible', async () => {
    isDeliveryCompatible.mockReturnValue(false);

    await expect(canAddNewOrder(makeBatch(), 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.BATCH_DELIVERY_NOT_COMPATIBLE,
    });
  });

  it('should return false when delivery is incompatible and throwOnError is false', async () => {
    isDeliveryCompatible.mockReturnValue(false);

    const result = await canAddNewOrder(makeBatch(), 'order-2', {
      throwOnError: false,
    });

    expect(result).toBe(false);
  });

  it('should throw when preparation is incompatible', async () => {
    isPreparationCompatible.mockReturnValue(false);

    await expect(canAddNewOrder(makeBatch(), 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.BATCH_PREPARATION_NOT_COMPATIBLE,
    });
  });
});

describe('orderAssignedForBatching', () => {
  const session = { id: 'session-1' };

  beforeEach(() => {
    vi.clearAllMocks();

    isBatchSizeAvailable.mockReturnValue(true);

    getOrdersByIds.mockResolvedValue([makeOrder()]);
    getOrderById.mockResolvedValue(makeOrder({ _id: 'order-2' }));

    isPickupCompatible.mockReturnValue(true);
    isDeliveryCompatible.mockReturnValue(true);
    isPreparationCompatible.mockReturnValue(true);
  });

  it('should create a new active batch when the driver has no active batch', async () => {
    const batch = makeBatch({ orderIds: ['order-2'] });

    DeliveryBatchModel.findOne.mockResolvedValue(null);
    DeliveryBatchModel.create.mockResolvedValue([batch]);
    OrderModel.findOneAndUpdate.mockResolvedValue(makeOrder({ _id: 'order-2' }));

    const result = await orderAssignedForBatching(session, 'driver-1', 'order-2');

    expect(DeliveryBatchModel.create).toHaveBeenCalledWith(
      [
        {
          driver: 'driver-1',
          orderIds: ['order-2'],
          status: BATCH_STATUS.ACTIVE,
        },
      ],
      { session }
    );

    expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'order-2',
        driverId: 'driver-1',
        batchId: null,
      },
      { $set: { batchId: batch._id } },
      expect.objectContaining({ session })
    );

    expect(result).toBe(batch);
  });

  it('should add an order to the existing active batch', async () => {
    const batch = makeBatch();
    const updatedBatch = makeBatch({
      orderIds: ['order-1', 'order-2'],
    });

    DeliveryBatchModel.findOne.mockResolvedValue(batch);
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(updatedBatch);
    OrderModel.findOneAndUpdate.mockResolvedValue(makeOrder({ _id: 'order-2' }));

    const result = await orderAssignedForBatching(session, 'driver-1', 'order-2');

    expect(DeliveryBatchModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: batch._id,
        driver: 'driver-1',
        status: BATCH_STATUS.ACTIVE,
      },
      { $addToSet: { orderIds: 'order-2' } },
      expect.objectContaining({ session })
    );

    expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'order-2',
        driverId: 'driver-1',
        batchId: null,
      },
      { $set: { batchId: batch._id } },
      expect.objectContaining({ session })
    );

    expect(result).toBe(updatedBatch);
  });

  it('should throw when the active batch is full', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(makeBatch());
    isBatchSizeAvailable.mockReturnValue(false);

    await expect(orderAssignedForBatching(session, 'driver-1', 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.DELIVERY_BATCH_IS_FULL,
    });

    expect(DeliveryBatchModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(DeliveryBatchModel.create).not.toHaveBeenCalled();
  });

  it('should not add the order when it is incompatible with the active batch', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(makeBatch());
    isPickupCompatible.mockReturnValue(false);

    await expect(orderAssignedForBatching(session, 'driver-1', 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.BATCH_PICKUP_NOT_COMPATIBLE,
    });

    expect(DeliveryBatchModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(OrderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should throw when the active batch is not available', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(makeBatch());
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(orderAssignedForBatching(session, 'driver-1', 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.DELIVERY_BATCH_NOT_AVAILABLE,
    });

    expect(OrderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should throw when the order is not eligible for batching in an existing batch', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(makeBatch());
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(makeBatch());
    OrderModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(orderAssignedForBatching(session, 'driver-1', 'order-2')).rejects.toMatchObject({
      status: 409,
      code: ERROR_CODES.ORDER_NOT_ELIGIBLE_FOR_BATCHING,
    });
  });
});

describe('isBatchComplete', () => {
  const driverId = 'driver-1';

  const activeBatch = {
    _id: 'batch-1',
    orderIds: ['order-1', 'order-2'],
    status: BATCH_STATUS.ACTIVE,
  };

  const deliveredOrders = [
    { _id: 'order-1', status: ORDER_STATUS.DELIVERED },
    { _id: 'order-2', status: ORDER_STATUS.DELIVERED },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when there is no active batch', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(null);
    const result = await isBatchComplete(driverId);

    expect(result).toBe(false);
    expect(DeliveryBatchModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should return false when no orders are found', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(activeBatch);
    getOrdersByIds.mockResolvedValue([]);

    const result = await isBatchComplete(driverId);

    expect(result).toBe(false);
    expect(DeliveryBatchModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should return false when not all orders are delivered', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(activeBatch);
    getOrdersByIds.mockResolvedValue([
      deliveredOrders[0],
      { _id: 'order-2', status: ORDER_STATUS.PENDING },
    ]);

    const result = await isBatchComplete(driverId);

    expect(result).toBe(false);
    expect(DeliveryBatchModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should return false when the batch update fails', async () => {
    DeliveryBatchModel.findOne.mockResolvedValue(activeBatch);
    getOrdersByIds.mockResolvedValue(deliveredOrders);
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(null);

    const result = await isBatchComplete(driverId);

    expect(result).toBe(false);
  });

  it('should mark the batch as completed when all orders are delivered', async () => {
    const completedBatch = {
      ...activeBatch,
      status: BATCH_STATUS.COMPLETED,
    };

    DeliveryBatchModel.findOne.mockResolvedValue(activeBatch);
    getOrdersByIds.mockResolvedValue(deliveredOrders);
    DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(completedBatch);

    const result = await isBatchComplete(driverId);

    expect(getOrdersByIds).toHaveBeenCalledWith(activeBatch.orderIds);

    expect(DeliveryBatchModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: activeBatch._id,
        status: BATCH_STATUS.ACTIVE,
      },
      {
        $set: {
          completedAt: expect.any(Date),
          status: BATCH_STATUS.COMPLETED,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    expect(result).toBe(true);
  });
});
