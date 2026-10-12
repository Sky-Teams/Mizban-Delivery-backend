import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { OrderModel } from '#modules/orders/index.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import {
  isBatchSizeAvailable,
  isDeliveryCompatible,
  isPickupCompatible,
  isPreparationCompatible,
} from '#shared/utils/batch.helper.js';
import { BATCH_STATUS, EVENT_BUS_EVENTS, ORDER_STATUS, SERVICE } from '#shared/utils/enums.js';

export const getDriverPendingBatches = async (driverId) => {
  return DeliveryBatchModel.find({
    driver: driverId,
    status: BATCH_STATUS.PENDING,
  }).sort({ createdAt: 1 });
};

/** Find the best pending batch for a new order. */
const findCompatibleBatch = async (driverId, newOrder) => {
  const pendingBatches = await getDriverPendingBatches(driverId);

  let compatibleBatches = [];

  for (const batch of pendingBatches) {
    const canAdd = await canAddOrderToBatch(batch, newOrder);

    if (canAdd) {
      compatibleBatches.push(batch);
    }
  }

  if (!compatibleBatches.length) return null;

  return compatibleBatches.sort(
    (batchA, batchB) => batchB.orderIds.length - batchA.orderIds.length
  )[0];
};

/** Check whether a new order can be added to the batch. */
export const canAddOrderToBatch = async (deliveryBatch, newOrder) => {
  // Check maximum batch orders
  if (!isBatchSizeAvailable(deliveryBatch)) {
    return false;
  }

  const orders = await getOrdersByIds(deliveryBatch.orderIds);

  for (const order of orders) {
    // Check source of new order
    if (order.source !== newOrder.source) {
      return false;
    }

    // Check pickUp location
    if (!isPickupCompatible(order, newOrder)) {
      return false;
    }

    // Check dropOff location
    if (!isDeliveryCompatible(order, newOrder)) {
      return false;
    }

    // Check preparation time
    if (!isPreparationCompatible(order, newOrder)) {
      return false;
    }
  }

  return true;
};

export const validateOrderForBatching = async (order) => {
  if (order.status !== ORDER_STATUS.ASSIGNED || order.batchId) {
    throw new AppError(
      'Order is not eligible for batching.',
      409,
      ERROR_CODES.ORDER_NOT_ELIGIBLE_FOR_BATCHING
    );
  }
};

const addOrderToBatchDelivery = async (session, deliveryBatchId, driverId, orderId) => {
  const updateDeliveryBatch = await DeliveryBatchModel.findOneAndUpdate(
    { _id: deliveryBatchId, driver: driverId, status: BATCH_STATUS.PENDING },
    { $addToSet: { orderIds: orderId } },
    { returnDocument: 'after', runValidators: true, session }
  );

  if (!updateDeliveryBatch) throw notFound('Delivery Batch');

  const updateOrder = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      status: ORDER_STATUS.ASSIGNED,
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

  if (!updateOrder) throw notFound('order');

  return updateDeliveryBatch;
};

const createBatchDelivery = async (session, driverId, orderId) => {
  const [deliveryBatch] = await DeliveryBatchModel.create(
    [
      {
        driver: driverId,
        orderIds: [orderId],
        status: BATCH_STATUS.PENDING,
      },
    ],
    { session }
  );

  const updateOrder = await OrderModel.findOneAndUpdate(
    { _id: orderId, driverId: driverId, status: ORDER_STATUS.ASSIGNED, batchId: null },
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

  if (!updateOrder) throw notFound('order');

  return deliveryBatch;
};

export const orderAssignedForBatching = async (session, driverId, order) => {
  await validateOrderForBatching(order);

  const compatibleBatch = await findCompatibleBatch(driverId, order);

  if (compatibleBatch) {
    //Add new order to batch delivery
    return addOrderToBatchDelivery(session, compatibleBatch._id, driverId, order._id);
  }
  // create new batch

  return createBatchDelivery(session, driverId, order._id);
};

// Return the active batch if one exists; otherwise, activate the oldest pending batch.
export const activateNextPendingBatch = async (driverId) => {
  // Check active batch
  let activeBatch;
  activeBatch = await DeliveryBatchModel.findOne({
    driver: driverId,
    status: BATCH_STATUS.ACTIVE,
  });

  if (activeBatch) return activeBatch;

  // Active oldest batches
  const oldestPendingBatch = await DeliveryBatchModel.findOne({
    driver: driverId,
    status: BATCH_STATUS.PENDING,
  }).sort({
    createdAt: 1,
  });

  if (!oldestPendingBatch) return null;

  // Update last batch to active batch
  activeBatch = await DeliveryBatchModel.findOneAndUpdate(
    {
      _id: oldestPendingBatch._id,
      driver: driverId,
      status: BATCH_STATUS.PENDING,
    },
    {
      $set: {
        status: BATCH_STATUS.ACTIVE,
        startedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  return activeBatch;
};

export const getActiveBatch = async (driverId) => {
  const activeBatch = await DeliveryBatchModel.findOne({
    driver: driverId,
    status: BATCH_STATUS.ACTIVE,
  });

  if (!activeBatch) throw new AppError('Active batch does not exist', 404, ERROR_CODES.NOT_FOUND);

  return activeBatch;
};

/** Check batch status for completed orders */
export const checkBatchForComplete = async (driverId) => {
  const activeBatch = await getActiveBatch(driverId);

  if (!activeBatch) return false;

  const orders = await getOrdersByIds(activeBatch.orderIds);

  if (!orders.length || orders.length !== activeBatch.orderIds.length) return false;

  const isBatchCompleted = await orders.every((order) => order.status === ORDER_STATUS.DELIVERED);
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

  eventBus.emit(EVENT_BUS_EVENTS.ACTIVE_BATCH_COMPLETED, {
    driverId: driverId,
  });

  return Boolean(completedBatch);
};
