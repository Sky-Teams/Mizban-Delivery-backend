import { getDriverStatusByDriverId } from '#modules/drivers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { orderUpdateQuery } from '#shared/utils/queryBuilder.js';
import { OrderModel } from '../../models/order.model.js';

export const addOrder = async (orderData) => {
  // orderData is validated by Zod, so no extra fields can exist

  let status = 'created';
  const timeline = {};

  // Driver validation
  if (orderData.driverId) {
    const driver = await getDriverStatusByDriverId(orderData.driverId);

    if (driver.status !== 'idle')
      throw new AppError(
        `Driver is not available. Driver status is ${driver.status}`,
        409,
        ERROR_CODES.DRIVER_NOT_IDLE
      );

    status = 'assigned';
    timeline.assignedAt = new Date();
  }

  // Calculate items total if items exist
  if (orderData.items?.length) {
    orderData.items = calculateItemsTotal(orderData.items);
  }

  // Calculate final price. We can extend it in future
  const amountToCollect = Number(orderData.amountToCollect || 0);
  const deliveryTotal = Number(orderData.deliveryPrice?.total || 0);

  // We can add discount in future, because discount is not sent from frontend
  const finalPrice = amountToCollect + deliveryTotal;

  const newOrder = await OrderModel.create({
    ...orderData,
    finalPrice,
    status,
    timeline,
  });

  // emit events
  eventBus.emit('order:created', {
    orderId: newOrder._id,
    userId: '69b1be9bf83d53a0cdc7266b', // We can use the sender Id in future to send notification, for now we send admin Id (hardcoded)
    newOrder,
  });

  return newOrder;
};

export const getOrderById = async (orderId) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw notFound('DeliveryRequest');

  return order;
};

export const updateOrderInfo = async (orderId, orderData) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'created' && order.status !== 'assigned') {
    throw new AppError(
      `Order Request can not be updated.Order status is ${order.status}`,
      409,
      ERROR_CODES.UPDATE_NOT_AVAILABLE
    );
  }

  const allowedFieldsToUpdate = {
    type: true,
    serviceType: true,
    scheduledFor: true,
    deliveryDeadline: true,
    priority: true,
    sender: true,
    receiver: true,
    pickupLocation: true,
    dropoffLocation: true,
    items: true,
    estimatedPrepTimeMinutes: true,
    packageDetails: true,
    serviceLevel: true,
    paymentType: true,
    paymentStatus: true,
    amountToCollect: true,
    deliveryPrice: true,
  };

  const updateQuery = orderUpdateQuery(orderData, allowedFieldsToUpdate);

  if (Object.keys(updateQuery).length === 0) {
    throw noFieldsProvidedForUpdate();
  }

  const amountToCollect = Number(updateQuery.amountToCollect ?? order.amountToCollect ?? 0);
  const deliveryTotal = Number(
    updateQuery['deliveryPrice.total'] ?? order.deliveryPrice.total ?? 0
  );

  updateQuery.finalPrice = amountToCollect + deliveryTotal;

  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { $set: updateQuery },
    { new: true, runValidators: true }
  );

  return updatedOrder;
};

export const assignDriver = async (session, orderId, driverId) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'created') {
    throw new AppError(
      `Cannot assign driver. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
    );
  }

  const driver = await getDriverStatusByDriverId(driverId);

  if (driver.status !== 'idle')
    throw new AppError(
      `Driver is not available. Driver status is ${driver.status}`,
      409,
      ERROR_CODES.DRIVER_NOT_IDLE
    );

  order.driverId = driver._id;
  order.status = 'assigned';
  order.timeline.assignedAt = new Date();

  driver.status = 'assigned';

  await order.save({ session });
  await driver.save({ session });

  return order;
};

export const pickupAnOrder = async (session, orderId) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'assigned') {
    throw new AppError(
      `Cannot pick up. Order status is ${order.status}.`,
      409,
      ERROR_CODES.PICKUP_NOT_ALLOWED
    );
  }

  const driver = await getDriverStatusByDriverId(order.driverId);

  order.status = 'pickedUp';
  order.timeline.pickedUpAt = new Date();

  driver.status = 'delivering';

  await order.save({ session });
  await driver.save({ session });

  return order;
};

export const deliverAnOrder = async (session, orderId) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'pickedUp') {
    throw new AppError(
      `Cannot order. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DELIVERY_NOT_DELIVERABLE
    );
  }

  const driver = await getDriverStatusByDriverId(order.driverId);

  order.status = 'delivered';
  order.timeline.deliveredAt = new Date();

  //TODO We should add more logic in here in future for transaction of money.
  order.paymentStatus = 'paid';

  driver.status = 'idle';

  await order.save({ session });
  await driver.save({ session });

  return order;
};

export const cancelAnOrder = async (session, orderId, reason) => {
  const order = await getOrderById(orderId);

  // Cannot cancel completed or cancelled orders
  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new AppError(
      `Cannot cancel order. Order status is ${order.status}.`,
      409,
      ERROR_CODES.CANCEL_NOT_ALLOWED
    );
  }

  // Release driver if exists
  if (order.driverId) {
    const driver = await getDriverStatusByDriverId(order.driverId);
    driver.status = 'idle';
    await driver.save({ session });
  }

  order.status = 'cancelled';
  order.timeline.cancelledAt = new Date();
  order.paymentStatus = 'failed'; //TODO We should add more logic in here in future.

  if (reason) {
    order.cancelReason = reason;
  }

  await order.save({ session });

  return order;
};

export const assignDriverToOrderWithTransaction = withTransaction(assignDriver);

export const pickupOrderWithTransaction = withTransaction(pickupAnOrder);

export const deliverOrderWithTransaction = withTransaction(deliverAnOrder);

export const cancelOrderWithTransaction = withTransaction(cancelAnOrder);
