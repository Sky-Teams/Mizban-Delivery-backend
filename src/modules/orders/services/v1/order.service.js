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
  REASON_TYPES,
} from '#shared/utils/enums.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import {
  buildOfferFilter,
  buildOrderFilter,
  countByStatus,
  orderUpdateQuery,
} from '#shared/utils/queryBuilder.js';
import { OrderModel } from '../../models/order.model.js';
import mongoose from 'mongoose';
import { OfferModel } from '#modules/offers/index.js';
import { deduplicateById, getObjectValues } from '#shared/utils/object.helper.js';
import { buildPaginatedResponse } from '#shared/utils/pagination.js';

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

/**
 * Retrieve orders based on filters, status, and pagination.
 *
 * @param {Number} page
 * @param {Number} limit
 * @param {Object} searchQuery
 * @param {String} role
 * @returns List of orders
 */
export const getAllOrders = async (page = 1, limit = 10, searchQuery = {}, role) => {
  const skip = (page - 1) * limit;

  const { driverId, status, startDate, endDate, ...filters } = searchQuery;

  const orderFilter = buildOrderFilter({
    driverId,
    startDate,
    endDate,
    filters,
  });

  // Logic Overview:
  // This function retrieves orders based on the provided status type.
  //
  // 1. Offer Status:
  //    - If the status belongs to OFFER_STATUS list,
  //    - fetch orders using order references stored in the Offer collection.
  //
  // 2. Order Status:
  //    - If the status belongs to ORDER_STATUS list,
  //    - fetch data directly from the Order collection.
  //
  // 3. No Status:
  //    - Fetch normal orders from Order collection
  //    - Also include relevant offer-based orders (rejected/expired)
  //    - Merge both datasets and return combined results

  // Check if the status provided in query parameter exists in the list of offer statuses
  const isOfferStatus = status === OFFER_STATUS.REJECTED || status === OFFER_STATUS.EXPIRED;

  // Check if the status provided in query parameters exists in the list of order statuses
  const isOrderStatus = getObjectValues(ORDER_STATUS).includes(status);

  // No status:
  // get all normal orders +
  // rejected/expired orders from offers collection
  if (!status) {
    let orders = await findOrders(orderFilter);

    if (role === ROLES.ADMIN) {
      orders = deduplicateById(orders);
    }

    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginatedOrders = sortedOrders.slice(skip, skip + limit);

    return buildPaginatedResponse(paginatedOrders, sortedOrders.length, limit);
  }

  // Order statuses:
  // data comes directly from orders collection
  if (isOrderStatus) {
    const { orders, totalOrders } = await findOrdersByOrderStatus(orderFilter, status, skip, limit);

    return buildPaginatedResponse(orders, totalOrders, limit);
  }

  // Offer statuses:
  // data comes from offers collection
  if (isOfferStatus) {
    let orders = await findOrdersByOfferStatus(orderFilter, status);

    if (role === ROLES.ADMIN) {
      orders = deduplicateById(orders);
    }

    const paginatedOrders = orders.slice(skip, skip + limit);

    return buildPaginatedResponse(paginatedOrders, orders.length, limit);
  }
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
    order.reason.type = REASON_TYPES.CANCELLED;
    order.reason.description = reason;
    order.reason.date = new Date();
  }

  await order.save({ session });
  eventBus.emit(EVENT_BUS_EVENTS.ORDER_CANCELLED, { orderId, reason });

  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

export const returnAnOrder = async (session, orderId, reason, user) => {
  const order = await getOrderById(orderId);

  // Cannot return an order when status is not pickedUp
  if (order.status !== ORDER_STATUS.PICKEDUP) {
    throw new AppError(
      `Cannot return order. Order status is ${order.status}.`,
      409,
      ERROR_CODES.RETURN_NOT_ALLOWED
    );
  }

  // Release driver if exists
  if (user.role === ROLES.ADMIN) {
    const driver = await fetchDriverByDriverId(order.driverId);
    // We do not need to terminate the process of returning when driver is not found and the request come from admin.
    if (driver) await driver.releaseFromOrder(session);
  }

  if (user.role === ROLES.DRIVER) {
    const driver = await fetchDriverByUserId(user._id);
    if (!driver) throw notFound('driver');
    doesDriverAssignedToOrder(driver._id, order.driverId);
    await driver.releaseFromOrder(session);
  }

  order.status = ORDER_STATUS.RETURNED;
  order.timeline.returnedAt = new Date();
  order.paymentStatus = PAYMENT_STATUS.FAILED; //TODO We should add more logic in here in future and also we should check how to pay to driver when an order is returned.

  if (reason) {
    order.reason.type = REASON_TYPES.RETURNED;
    order.reason.description = reason;
    order.reason.date = new Date();
  }

  await order.save({ session });
  eventBus.emit(EVENT_BUS_EVENTS.ORDER_RETURNED, { orderId, reason });

  // Return filtered fields to driver
  if (user.role === ROLES.DRIVER) return DtoService.order(order);

  // Return all fields to admin
  return order;
};

export const getOrdersStatistics = async (driverId) => {
  const driverObjectId = driverId ? new mongoose.Types.ObjectId(driverId) : null;

  const filterOrder = driverObjectId ? { driverId: driverObjectId } : {};
  const filterOffer = driverObjectId ? { driver: driverObjectId } : {};

  const orderAggregateQuery = [
    { $match: filterOrder },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        created: countByStatus(ORDER_STATUS.CREATED),
        assigned: countByStatus(ORDER_STATUS.ASSIGNED),
        pickedUp: countByStatus(ORDER_STATUS.PICKEDUP),
        delivered: countByStatus(ORDER_STATUS.DELIVERED),
        cancelled: countByStatus(ORDER_STATUS.CANCELLED),
      },
    },
    { $project: { _id: 0 } },
  ];

  const offerAggregateQuery = [
    { $match: filterOffer },
    {
      $group: {
        _id: null,
        totalOffers: { $sum: 1 },
        accepted: countByStatus(OFFER_STATUS.ACCEPTED),
        rejected: countByStatus(OFFER_STATUS.REJECTED),
        pending: countByStatus(OFFER_STATUS.PENDING),
        expired: countByStatus(OFFER_STATUS.EXPIRED),
      },
    },
    { $project: { _id: 0 } },
  ];

  const [orderResult, offerResult] = await Promise.all([
    OrderModel.aggregate(orderAggregateQuery),
    OfferModel.aggregate(offerAggregateQuery),
  ]);

  const orderStats = orderResult[0] || {};
  const offerStats = offerResult[0] || {};

  return {
    totalOrders: orderStats.total ?? 0,
    created: orderStats.created ?? 0,
    assigned: orderStats.assigned ?? 0,
    pickedUp: orderStats.pickedUp ?? 0,
    delivered: orderStats.delivered ?? 0,
    cancelled: orderStats.cancelled ?? 0,
    totalOffers: offerStats.totalOffers ?? 0,
    accepted: offerStats.accepted ?? 0,
    rejected: offerStats.rejected ?? 0,
    pending: offerStats.pending ?? 0,
    expired: offerStats.expired ?? 0,
  };
};

/**
 * Get offers and return their related orders.
 * Filters offers by driverId and status, then matches orders and maps results.
 *
 * @param {Object} params
 * @param {String} [params.driverId] - Driver ID filter
 * @param {Object} params.filter - Order filter for matching populated order
 * @param {String} [params.status] - Offer status filter
 * @returns {Promise<Array>} List of orders from offers
 */
const getOffersWithOrders = async ({ driverId, filter, status }) => {
  const query = {};

  if (driverId) {
    query.driver = driverId;
  }

  if (status) {
    query.status = status;
  }

  const offers = await OfferModel.find(query)
    .populate({
      path: 'order',
      match: filter,
    })
    .lean();

  const filteredOffers = offers.filter((offer) => offer.order);

  const mappedOrders = DtoService.mapOfferOrders(filteredOffers);

  return mappedOrders;
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

/**
 * Fetches all orders when no status filter is applied.
 * Combines normal orders from the Order collection with offer-based orders
 * (e.g. rejected or expired offers).
 *
 * @param {Object} filter - Query filter object for searching orders
 * @param {String} [filter.driverId] - Driver ID filter
 * @param {String} [filter.startDate] - Start date filter
 * @param {String} [filter.endDate] - End date filter
 * @returns {Promise<Array>} Merged list of orders from orders and offers
 */
export const findOrders = async (filter = {}) => {
  const { driverId, startDate, endDate, ...filters } = filter;

  const offerFilter = buildOfferFilter({
    startDate,
    endDate,
    filters,
  });

  const [orders, offerOrders] = await Promise.all([
    OrderModel.find(filter).sort({ createdAt: -1 }).lean(),
    getOffersWithOrders({
      driverId,
      filter: offerFilter,
      status: {
        $in: [OFFER_STATUS.REJECTED, OFFER_STATUS.EXPIRED],
      },
    }),
  ]);

  const mergedOrders = [...orders, ...offerOrders];

  return mergedOrders;
};

/**
 * Fetches orders from the Order collection based on a specific order status.
 *
 * Applies filtering, pagination, and returns both the matching orders
 * and the total count for pagination purposes.
 *
 * @param {Object} filter - Query filter object for searching orders
 * @param {String} status - Order status to filter by
 * @param {Number} skip - Number of records to skip (pagination)
 * @param {Number} limit - Number of records to return (pagination limit)
 *
 * @returns {Promise<{orders: Array, totalOrders: Number}>}
 * Object containing filtered orders and total count
 */
export const findOrdersByOrderStatus = async (filter = {}, status, skip, limit) => {
  const query = {
    ...filter,
    status,
  };

  const [orders, totalOrders] = await Promise.all([
    OrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

    OrderModel.countDocuments(query),
  ]);

  return { orders, totalOrders };
};

/**
 * Fetches orders related to offers based on a specific offer status.
 *
 * This function retrieves orders that originate from the Offer collection
 * (e.g. rejected or expired offers) and applies additional filtering.
 *
 * @param {Object} filter - Query filter object for searching offers
 * @param {String} status - Offer status to filter by
 *
 * @returns {Promise<Array>} List of orders derived from offers
 */
export const findOrdersByOfferStatus = async (filter = {}, status) => {
  const { driverId, startDate, endDate, ...filters } = filter;
  const offerFilter = buildOfferFilter({
    startDate,
    endDate,
    filters,
  });

  const offerOrders = await getOffersWithOrders({
    driverId,
    filter: offerFilter,
    status,
  });

  return offerOrders;
};

export const assignDriverToOrderWithTransaction = withTransaction(assignDriver);

export const pickupOrderWithTransaction = withTransaction(pickupAnOrder);

export const deliverOrderWithTransaction = withTransaction(deliverAnOrder);

export const cancelOrderWithTransaction = withTransaction(cancelAnOrder);

export const returnOrderWithTransaction = withTransaction(returnAnOrder);
