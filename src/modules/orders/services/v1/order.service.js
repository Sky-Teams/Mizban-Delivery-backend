import {
  fetchDriverByDriverId,
  fetchDriverByUserId,
  getDriverStatusByDriverId,
} from '#modules/drivers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { DtoService } from '#shared/utils/dtoService.js';
import {
  EVENT_BUS_EVENTS,
  DRIVER_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ROLES,
  OFFER_STATUS,
} from '#shared/utils/enums.js';
import { DateHelper } from '#shared/utils/date.helper.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { orderUpdateQuery } from '#shared/utils/queryBuilder.js';
import { OrderModel } from '../../models/order.model.js';
import mongoose from 'mongoose';
import { OfferModel } from '#modules/offers/index.js';

//#region Admin Services

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
  eventBus.emit(EVENT_BUS_EVENTS.ORDER_CREATED, {
    orderId: newOrder._id,
    pickupLocation: newOrder.pickupLocation,
  });
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

  if (searchQuery.startDate || searchQuery.endDate) {
    query.createdAt = {};
  }

  if (searchQuery.startDate) {
    query.createdAt.$gte = DateHelper.getStartDateUTC(searchQuery.startDate);
    delete query.startDate; // Remove the startDate field from query because we filter based on createdAt
  }

  if (searchQuery.endDate) {
    query.createdAt.$lte = DateHelper.getEndDateUTC(searchQuery.endDate);
    delete query.endDate; // Remove the endDate field from query because we filter based on createdAt
  }

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

//#endregion

//#region Admin And Driver Services

export const pickupAnOrder = async (session, orderId, user) => {
  const order = await getOrderById(orderId);

  if (order.status !== ORDER_STATUS.ASSIGNED) {
    throw new AppError(
      `Cannot pick up. Order status is ${order.status}.`,
      409,
      ERROR_CODES.PICKUP_NOT_ALLOWED
    );
  }

  // If the request come from admin, we should check the existence of driver from order.driverId
  // If the request come from driver, we should check the existence of driver from token(user._id)
  const driver =
    user.role === ROLES.ADMIN
      ? await fetchDriverByDriverId(order.driverId)
      : await fetchDriverByUserId(user._id);

  if (!driver) throw notFound('driver');

  if (user.role === ROLES.DRIVER) {
    doesDriverAssignedToOrder(driver._id, order.driverId);
  }

  order.status = ORDER_STATUS.PICKEDUP;
  order.timeline.pickedUpAt = new Date();

  driver.status = DRIVER_STATUS.DELIVERING;

  await order.save({ session });
  await driver.save({ session });

  console.log(`Order ${orderId} is pickedUp by driver ${order.driverId}`);

  eventBus.emit(EVENT_BUS_EVENTS.ORDER_PICKEDUP, {
    orderId,
    driverId: driver._id,
    pickedUpAt: order.timeline.pickedUpAt,
  });

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

  // If the request come from admin, we should check the existence of driver from order.driverId
  // If the request come from driver, we should check the existence of driver from token(user._id)
  const driver =
    user.role === ROLES.ADMIN
      ? await fetchDriverByDriverId(order.driverId)
      : await fetchDriverByUserId(user._id);

  if (!driver) throw notFound('driver');

  if (user.role === ROLES.DRIVER) {
    doesDriverAssignedToOrder(driver._id, order.driverId);
  }

  order.status = ORDER_STATUS.DELIVERED;
  order.timeline.deliveredAt = new Date();

  //TODO We should add more logic in here in future for transaction of money.
  order.paymentStatus = PAYMENT_STATUS.PAID;

  await order.save({ session });
  await driver.releaseFromOrder(session);

  eventBus.emit(EVENT_BUS_EVENTS.ORDER_DELIVERED, {
    orderId,
    driverId: driver._id,
    deliveredAt: order.timeline.deliveredAt,
  });

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
  if (user.role === ROLES.ADMIN) {
    const driver = await fetchDriverByDriverId(order.driverId);
    // We do not need to terminate the process of cancelling when driver is not found and the request come from admin.
    if (driver) await driver.releaseFromOrder(session);
  }

  if (user.role === ROLES.DRIVER) {
    const driver = await fetchDriverByUserId(user._id);
    if (!driver) throw notFound('driver');
    doesDriverAssignedToOrder(driver._id, order.driverId);
    await driver.releaseFromOrder(session);
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.timeline.cancelledAt = new Date();
  order.paymentStatus = PAYMENT_STATUS.FAILED; //TODO We should add more logic in here in future.

  //TODO: Do we need to add cancelledBy field in DB?

  if (reason) {
    order.cancelReason = reason;
  }

  await order.save({ session });
  eventBus.emit(EVENT_BUS_EVENTS.ORDER_CANCELLED, { orderId, reason });

  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

export const getOrdersStatistics = async (driverId) => {
  const aggregateQuery = [];
  if (driverId) {
    aggregateQuery.push({ $match: { driverId: new mongoose.Types.ObjectId(driverId) } });
  }

  aggregateQuery.push(
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        created: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CREATED] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.ASSIGNED] }, 1, 0] } },
        pickedUp: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.PICKEDUP] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.DELIVERED] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] } },
      },
    },
    { $project: { _id: 0 } }
  );

  const statistics = await OrderModel.aggregate(aggregateQuery);

  const offerAggregateQuery = [];

  if (driverId) {
    offerAggregateQuery.push({ $match: { driver: new mongoose.Types.ObjectId(driverId) } });
  }

  offerAggregateQuery.push(
    {
      $group: {
        _id: null,
        totalOffers: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$status', OFFER_STATUS.ACCEPTED] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', OFFER_STATUS.REJECTED] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', OFFER_STATUS.PENDING] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$status', OFFER_STATUS.EXPIRED] }, 1, 0] } },
      },
    },
    { $project: { _id: 0 } }
  );

  const offerStatistics = await OfferModel.aggregate(offerAggregateQuery);

  const result = [...statistics, ...offerStatistics];

  return result;
};
//#endregion

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
const doesDriverAssignedToOrder = (driverId, orderDriverId) => {
  if (!driverId || !orderDriverId || driverId.toString() !== orderDriverId.toString()) {
    throw new AppError('Order is not yours', 400, ERROR_CODES.ORDER_NOT_YOURS);
  }

  return true;
};

export const assignDriverToOrderWithTransaction = withTransaction(assignDriver);

export const pickupOrderWithTransaction = withTransaction(pickupAnOrder);

export const deliverOrderWithTransaction = withTransaction(deliverAnOrder);

export const cancelOrderWithTransaction = withTransaction(cancelAnOrder);
