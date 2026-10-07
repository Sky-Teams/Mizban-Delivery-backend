import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canAddOrderToBatch,
  getDriverPendingBatches,
  orderAssignedForBatching,
} from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';

import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { OrderModel } from '#modules/orders/index.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';

import {
  isBatchSizeAvailable,
  isDeliveryCompatible,
  isPickupCompatible,
  isPreparationCompatible,
} from '#shared/utils/batch.helper.js';

import { BATCH_STATUS, ORDER_STATUS, SERVICE } from '#shared/utils/enums.js';

vi.mock('#modules/deliveryBatch/model/delivery.batch.model.js', () => ({
  DeliveryBatchModel: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('#modules/orders/models/order.model.js', () => ({
  OrderModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#modules/orders/services/v1/order.service.js', () => ({
  getOrdersByIds: vi.fn(),
}));

vi.mock('#shared/utils/batch.helper.js', () => ({
  isBatchSizeAvailable: vi.fn(),
  isDeliveryCompatible: vi.fn(),
  isPickupCompatible: vi.fn(),
  isPreparationCompatible: vi.fn(),
}));

describe('delivery batch service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDriverPendingBatches', () => {
    it('should return pending batches ordered by createdAt', async () => {
      const batches = [
        {
          _id: 'batch1',
          driver: 'driver1',
          status: BATCH_STATUS.PENDING,
        },
      ];

      const sort = vi.fn().mockResolvedValue(batches);

      DeliveryBatchModel.find.mockReturnValue({
        sort,
      });

      const result = await getDriverPendingBatches('driver1');

      expect(DeliveryBatchModel.find).toHaveBeenCalledWith({
        driver: 'driver1',
        status: BATCH_STATUS.PENDING,
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: 1,
      });

      expect(result).toEqual(batches);
    });
  });

  describe('canAddOrderToBatch', () => {
    const batch = {
      _id: 'batch1',
      orderIds: ['order1', 'order2'],
    };

    const newOrder = {
      _id: 'order3',
    };

    it('should return false when batch size is not available', async () => {
      isBatchSizeAvailable.mockReturnValue(false);

      const result = await canAddOrderToBatch(batch, newOrder);

      expect(result).toBe(false);

      expect(isBatchSizeAvailable).toHaveBeenCalledWith(batch);
      expect(getOrdersByIds).not.toHaveBeenCalled();
    });

    it('should return false when pickup is not compatible', async () => {
      isBatchSizeAvailable.mockReturnValue(true);

      getOrdersByIds.mockResolvedValue([{ _id: 'order1' }, { _id: 'order2' }]);

      isPickupCompatible.mockReturnValue(false);

      const result = await canAddOrderToBatch(batch, newOrder);

      expect(result).toBe(false);

      expect(isPickupCompatible).toHaveBeenCalledWith({ _id: 'order1' }, newOrder);

      expect(isDeliveryCompatible).not.toHaveBeenCalled();
    });

    it('should return false when delivery is not compatible', async () => {
      isBatchSizeAvailable.mockReturnValue(true);

      getOrdersByIds.mockResolvedValue([{ _id: 'order1' }]);

      isPickupCompatible.mockReturnValue(true);
      isDeliveryCompatible.mockReturnValue(false);

      const result = await canAddOrderToBatch(batch, newOrder);

      expect(result).toBe(false);

      expect(isDeliveryCompatible).toHaveBeenCalledWith({ _id: 'order1' }, newOrder);

      expect(isPreparationCompatible).not.toHaveBeenCalled();
    });

    it('should return false when preparation time is not compatible', async () => {
      isBatchSizeAvailable.mockReturnValue(true);

      getOrdersByIds.mockResolvedValue([{ _id: 'order1' }]);

      isPickupCompatible.mockReturnValue(true);
      isDeliveryCompatible.mockReturnValue(true);
      isPreparationCompatible.mockReturnValue(false);

      const result = await canAddOrderToBatch(batch, newOrder);

      expect(result).toBe(false);

      expect(isPreparationCompatible).toHaveBeenCalledWith({ _id: 'order1' }, newOrder);
    });

    it('should return true when all orders are compatible', async () => {
      isBatchSizeAvailable.mockReturnValue(true);

      const orders = [{ _id: 'order1' }, { _id: 'order2' }];

      getOrdersByIds.mockResolvedValue(orders);

      isPickupCompatible.mockReturnValue(true);
      isDeliveryCompatible.mockReturnValue(true);
      isPreparationCompatible.mockReturnValue(true);

      const result = await canAddOrderToBatch(batch, newOrder);

      expect(result).toBe(true);

      expect(getOrdersByIds).toHaveBeenCalledWith(batch.orderIds);

      expect(isPickupCompatible).toHaveBeenCalledTimes(2);
      expect(isDeliveryCompatible).toHaveBeenCalledTimes(2);
      expect(isPreparationCompatible).toHaveBeenCalledTimes(2);
    });
  });

  describe('orderAssignedForBatching', () => {
    const session = {
      id: 'session1',
    };

    const order = {
      _id: 'order1',
      status: ORDER_STATUS.ASSIGNED,
      batchId: null,
      source: SERVICE.MIZBAN,
    };

    it('should reject an order that is not eligible for batching', async () => {
      const invalidOrder = {
        ...order,
        status: ORDER_STATUS.CREATED,
      };

      await expect(orderAssignedForBatching(session, 'driver1', invalidOrder)).rejects.toThrow();

      expect(DeliveryBatchModel.find).not.toHaveBeenCalled();
      expect(DeliveryBatchModel.create).not.toHaveBeenCalled();
    });

    it('should create a new batch when no compatible batch exists', async () => {
      DeliveryBatchModel.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      const createdBatch = {
        _id: 'batch1',
        driver: 'driver1',
        orderIds: ['order1'],
        status: BATCH_STATUS.PENDING,
      };

      DeliveryBatchModel.create.mockResolvedValue([createdBatch]);

      OrderModel.findOneAndUpdate.mockResolvedValue({
        ...order,
        batchId: createdBatch._id,
      });

      const result = await orderAssignedForBatching(session, 'driver1', order);

      expect(DeliveryBatchModel.create).toHaveBeenCalledWith(
        [
          {
            driver: 'driver1',
            orderIds: ['order1'],
            status: BATCH_STATUS.PENDING,
          },
        ],
        { session }
      );

      expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'order1',
          driverId: 'driver1',
          status: ORDER_STATUS.ASSIGNED,
          batchId: null,
        },
        {
          $set: {
            batchId: createdBatch._id,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        }
      );

      expect(result).toEqual(createdBatch);
    });

    it('should add the order to an existing compatible batch', async () => {
      const existingBatch = {
        _id: 'batch1',
        driver: 'driver1',
        orderIds: ['order2'],
        status: BATCH_STATUS.PENDING,
      };

      const updatedBatch = {
        ...existingBatch,
        orderIds: ['order2', 'order1'],
      };

      DeliveryBatchModel.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([existingBatch]),
      });

      getOrdersByIds.mockResolvedValue([
        {
          _id: 'order2',
        },
      ]);

      isBatchSizeAvailable.mockReturnValue(true);
      isPickupCompatible.mockReturnValue(true);
      isDeliveryCompatible.mockReturnValue(true);
      isPreparationCompatible.mockReturnValue(true);

      DeliveryBatchModel.findOneAndUpdate.mockResolvedValue(updatedBatch);

      OrderModel.findOneAndUpdate.mockResolvedValue({
        ...order,
        batchId: existingBatch._id,
      });

      const result = await orderAssignedForBatching(session, 'driver1', order);

      expect(DeliveryBatchModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: existingBatch._id,
          driver: 'driver1',
          status: BATCH_STATUS.PENDING,
        },
        {
          $addToSet: {
            orderIds: 'order1',
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        }
      );

      expect(OrderModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'order1',
          status: ORDER_STATUS.ASSIGNED,
          driverId: 'driver1',
          batchId: null,
        },
        {
          $set: {
            batchId: existingBatch._id,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        }
      );

      expect(result).toEqual(updatedBatch);
    });
  });
});
