import { fetchDriverByDriverId, getDriverStatusByDriverId } from '#modules/drivers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { DtoService } from '#shared/utils/dtoService.js';
import {
  CUSTOM_EVENTS,
  DRIVER_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ROLES,
} from '#shared/utils/enums.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { orderUpdateQuery } from '#shared/utils/queryBuilder.js';
import { OrderModel } from '../../models/order.model.js';

export const addOrder = async (orderData) => {
  // orderData is validated by Zod, so no extra fields can exist

  let status = ORDER_STATUS.CREATED;
  const timeline = {};

  // Driver validation
  if (orderData.driverId) {
    const driver = await getDriverStatusByDriverId(orderData.driverId);

    if (driver.status !== DRIVER_STATUS.IDLE)
      throw new AppError(
        `Driver is not available. Driver status is ${driver.status}`,
        409,
        ERROR_CODES.DRIVER_NOT_IDLE
      );

    status = ORDER_STATUS.ASSIGNED;
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
  eventBus.emit(CUSTOM_EVENTS.ORDER_CREATED, { orderId: newOrder._id });
  return newOrder;
};

export const getOrderById = async (orderId) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw notFound('Order');

  return order;
};

export const getAllOrders = async (page = 1, limit = 10, searchQuery = {}) => {
  const skip = (page - 1) * limit;

  let query = Object.fromEntries(
    Object.entries(searchQuery).filter(([_, value]) => value !== null && value !== undefined)
  );

  const totalOrders = await OrderModel.countDocuments(query);
  const orders = await OrderModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    orders,
    totalOrders,
    totalPage: Math.ceil(totalOrders / limit),
  };
};

export const updateOrderInfo = async (orderId, orderData) => {
  const order = await getOrderById(orderId);

  if (order.status !== ORDER_STATUS.CREATED && order.status !== ORDER_STATUS.ASSIGNED) {
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

  if (order.status !== ORDER_STATUS.CREATED) {
    throw new AppError(
      `Cannot assign driver. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
    );
  }

  const driver = await getDriverStatusByDriverId(driverId);

  if (driver.status !== DRIVER_STATUS.IDLE)
    throw new AppError(
      `Driver is not available. Driver status is ${driver.status}`,
      409,
      ERROR_CODES.DRIVER_NOT_IDLE
    );

  order.driverId = driver._id;
  order.status = ORDER_STATUS.ASSIGNED;
  order.timeline.assignedAt = new Date();

  driver.status = DRIVER_STATUS.ASSIGNED;

  await order.save({ session });
  await driver.save({ session });

  return order;
};

export const pickupAnOrder = async (session, orderId, user) => {
  const order = await getOrderById(orderId);

  if (order.status !== ORDER_STATUS.ASSIGNED) {
    throw new AppError(
      `Cannot pick up. Order status is ${order.status}.`,
      409,
      ERROR_CODES.PICKUP_NOT_ALLOWED
    );
  }

  // const driver = await getDriverStatusByDriverId(order.driverId);

  //TODO: Add validation that if the order is assigned to driver(order related to the driver)

  // Requested Driver Id must be equal to order.driverId

  // TODO: We should check if the request come from driver or admin

  const driver = await fetchDriverByDriverId(order.driverId);
  if (!driver) notFound('driver');

  doesDriverAssginedToOrder(driver._id, order.driverId);

  order.status = ORDER_STATUS.PICKEDUP;
  order.timeline.pickedUpAt = new Date();

  driver.status = DRIVER_STATUS.DELIVERING;

  await order.save({ session });
  await driver.save({ session });

  console.log(`Order ${orderId} is pickedUp by driver ${order.driverId}`);

  //TODO: We should not send all data to driver if the request is from driver
  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

export const deliverAnOrder = async (session, orderId, user) => {
  const order = await getOrderById(orderId);

  if (order.status !== ORDER_STATUS.PICKEDUP) {
    throw new AppError(
      `Cannot mark as delivered. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DELIVERY_NOT_DELIVERABLE
    );
  }

  // const driver = await getDriverStatusByDriverId(order.driverId);
  const driver = await fetchDriverByDriverId(order.driverId);
  if (!driver) notFound('driver');

  doesDriverAssginedToOrder(driver._id, order.driverId);

  order.status = ORDER_STATUS.DELIVERED;
  order.timeline.deliveredAt = new Date();

  //TODO We should add more logic in here in future for transaction of money.
  order.paymentStatus = PAYMENT_STATUS.PAID;

  driver.status = DRIVER_STATUS.IDLE;

  //TODO: We should decrease the number of activeOrders in driver model
  driver.activeOrders = Math.max(0, driver.activeOrders - 1);

  await order.save({ session });
  await driver.save({ session });

  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

export const cancelAnOrder = async (session, orderId, reason, user) => {
  const order = await getOrderById(orderId);

  // Cannot cancel completed or cancelled orders
  if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    throw new AppError(
      `Cannot cancel order. Order status is ${order.status}.`,
      409,
      ERROR_CODES.CANCEL_NOT_ALLOWED
    );
  }

  // Release driver if exists
  if (order.driverId) {
    // const driver = await getDriverStatusByDriverId(order.driverId);
    const driver = await fetchDriverByDriverId(order.driverId);
    if (!driver) notFound('driver');
    doesDriverAssginedToOrder(driver._id, order.driverId);
    driver.status = DRIVER_STATUS.IDLE;
    driver.activeOrders = Math.max(0, driver.activeOrders - 1);
    await driver.save({ session });
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.timeline.cancelledAt = new Date();
  order.paymentStatus = PAYMENT_STATUS.FAILED; //TODO We should add more logic in here in future.

  if (reason) {
    order.cancelReason = reason;
  }

  await order.save({ session });

  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

/** Add drivers info (id, eta, distance ) in related order record */
export const addDriversDataInOrder = async (orderId, drivers) => {
  try {
    if (drivers.length === 0) return;

    const driversInfo = drivers.map((driver) => {
      return {
        id: driver._id,
        eta: driver.eta,
        distance: driver.distance,
      };
    });

    const order = await OrderModel.findByIdAndUpdate(orderId, {
      $set: { recommendedDrivers: driversInfo },
    });

    if (!order) throw notFound('order');

    return order;
  } catch (error) {
    throw error;
  }
};

/**  Increase the currentDriverIndex in order model to send offer to next driver */
export const increaseDriverIndex = async (orderId, session = null) => {
  try {
    const options = { new: true };
    if (session) options.session = session;

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { $inc: { currentDriverIndex: 1 } },
      options
    );
    if (!order) throw notFound('Order');

    return order;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if the driver is assigned to order
 * @param {string | ObjectId} driverId - Id of driver in driver collection
 * @param {string | ObjectId} orderDriverId - DriverId in order collection
 */
const doesDriverAssginedToOrder = (driverId, orderDriverId) => {
  if (driverId.toString() !== orderDriverId.toString()) {
    throw new AppError('Order is not yours', 400, ERROR_CODES.ORDER_NOT_YOURS);
  }

  return true;
};

export const assignDriverToOrderWithTransaction = withTransaction(assignDriver);

export const pickupOrderWithTransaction = withTransaction(pickupAnOrder);

export const deliverOrderWithTransaction = withTransaction(deliverAnOrder);

export const cancelOrderWithTransaction = withTransaction(cancelAnOrder);
