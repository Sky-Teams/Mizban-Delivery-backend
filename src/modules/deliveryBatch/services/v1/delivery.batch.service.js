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
import { BATCH_STATUS } from '#shared/utils/enums.js';

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
        startedAt: new Date()
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

export const canAddNewOrder = async (batch, orderId) => {
  const orders = await getOrdersByIds(batch.orderIds);

  const newOrderDetails = await getOrderById(orderId);

  for (const order of orders) {
    if (!isPickupCompatible(order, newOrderDetails)) return false;

    if (!isDeliveryCompatible(order, newOrderDetails)) return false;

    if (!isPreparationCompatible(order, newOrderDetails)) return false;
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

  const canAddOrder = await canAddNewOrder(activeBatch, orderId);
  if (!canAddOrder) {
    throw new AppError(
      'Order is not compatible with the delivery batch',
      409,
      ERROR_CODES.ORDER_NOT_ELIGIBLE_FOR_BATCHING
    );
  }

  return addOrderToActiveBatch(session, activeBatch._id, driverId, orderId);
};
