import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { OrderModel } from '#modules/orders/index.js';
import { getOrderById, getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import {
  isBatchSizeAvailable,
  isDeliveryCompatible,
  isPickupCompatible,
  isPreparationCompatible,
} from '#shared/utils/batch.helper.js';
import { BATCH_STATUS, ORDER_STATUS } from '#shared/utils/enums.js';

const addOrderToActiveBatch = async (session, deliveryBatchId, driverId, orderId) => {
  const updateDeliveryBatch = await DeliveryBatchModel.findOneAndUpdate(
    {
      _id: deliveryBatchId,
      driver: driverId,
      status: BATCH_STATUS.ACTIVE,
    },
    { $addToSet: { orderIds: orderId } },
    { returnDocument: 'after', runValidators: true, session }
  );

  if (!updateDeliveryBatch)
    throw new AppError('Batch not available', 409, ERROR_CODES.DELIVERY_BATCH_NOT_AVAILABLE);

  const updateOrder = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      driverId,
      batchId: null,
    },
    {
      $set: {
        batchId: updateDeliveryBatch._id,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
      session,
    }
  );

  if (!updateOrder) {
    throw new AppError(
      'Order is not eligible for batching',
      409,
      ERROR_CODES.ORDER_NOT_ELIGIBLE_FOR_BATCHING
    );
  }

  return updateDeliveryBatch;
};

const createActiveBatch = async (session, driverId, orderId) => {
  const [deliveryBatch] = await DeliveryBatchModel.create(
    [
      {
        driver: driverId,
        orderIds: [orderId],
        status: BATCH_STATUS.ACTIVE,
      },
    ],
    { session }
  );

  const updateOrder = await OrderModel.findOneAndUpdate(
    { _id: orderId, driverId: driverId, batchId: null },
    {
      $set: {
        batchId: deliveryBatch._id,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
      session,
    }
  );

  if (!updateOrder)
    throw new AppError(
      'Order is not eligible for batching',
      409,
      ERROR_CODES.ORDER_NOT_ELIGIBLE_FOR_BATCHING
    );

  return deliveryBatch;
};

export const driverActiveBatch = async (driverId) => {
  return await DeliveryBatchModel.findOne({
    driver: driverId,
    status: BATCH_STATUS.ACTIVE,
  });
};

export const canAddNewOrder = async (batch, orderId, { throwOnError = true } = {}) => {
  const orders = await getOrdersByIds(batch.orderIds);

  const newOrderDetails = await getOrderById(orderId);

  for (const order of orders) {
    if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED)
      continue;

    if (!isPickupCompatible(order, newOrderDetails)) {
      if (!throwOnError) return false;
      throw new AppError(
        'Order pickup is not compatible with the active batch',
        409,
        ERROR_CODES.BATCH_PICKUP_NOT_COMPATIBLE
      );
    }

    if (!isDeliveryCompatible(order, newOrderDetails)) {
      if (!throwOnError) return false;
      throw new AppError(
        'Order delivery is not compatible with the active batch',
        409,
        ERROR_CODES.BATCH_DELIVERY_NOT_COMPATIBLE
      );
    }

    if (!isPreparationCompatible(order, newOrderDetails)) {
      if (!throwOnError) return false;
      throw new AppError(
        'Order preparation is not compatible with the active batch',
        409,
        ERROR_CODES.BATCH_PREPARATION_NOT_COMPATIBLE
      );
    }
  }

  return true;
};

export const orderAssignedForBatching = async (session, driverId, orderId) => {
  const activeBatch = await driverActiveBatch(driverId);

  if (!activeBatch) {
    return createActiveBatch(session, driverId, orderId);
  }

  if (!isBatchSizeAvailable(activeBatch)) {
    throw new AppError('Delivery batch is full', 409, ERROR_CODES.DELIVERY_BATCH_IS_FULL);
  }

  await canAddNewOrder(activeBatch, orderId);

  return addOrderToActiveBatch(session, activeBatch._id, driverId, orderId);
};

/** Check batch status for completed orders */
export const checkBatchForComplete = async (driverId) => {
  const activeBatch = await driverActiveBatch(driverId);

  if (!activeBatch) return false;

  const orders = await getOrdersByIds(activeBatch.orderIds);

  if (!orders.length || orders.length !== activeBatch.orderIds.length) return false;

  const isBatchCompleted = orders.every((order) => order.status === ORDER_STATUS.DELIVERED);
  if (!isBatchCompleted) return false;

  const completedBatch = await DeliveryBatchModel.findOneAndUpdate(
    {
      _id: activeBatch._id,
      status: BATCH_STATUS.ACTIVE,
    },
    {
      $set: {
        completedAt: new Date(),
        status: BATCH_STATUS.COMPLETED,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  if (!completedBatch) return false;

  return Boolean(completedBatch);
};
