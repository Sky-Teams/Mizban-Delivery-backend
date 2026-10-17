import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { OrderModel } from '#modules/orders/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { isBatchSizeAvailable } from '#shared/utils/batch.helper.js';
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

export const orderAssignedForBatching = async (session, driverId, orderId) => {
  const activeBatch = await driverActiveBatch(driverId);

  if (!activeBatch) {
    return createActiveBatch(session, driverId, orderId);
  }

  if (!isBatchSizeAvailable(activeBatch)) {
    throw new AppError('Delivery batch is full', 409, ERROR_CODES.DELIVERY_BATCH_IS_FULL);
  }

  return addOrderToActiveBatch(session, activeBatch._id, driverId, orderId);
};
