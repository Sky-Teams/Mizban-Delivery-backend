import {
  assignDriverToOrderWithTransaction,
  cancelOrderWithTransaction,
  addOrder,
  deliverOrderWithTransaction,
  pickupOrderWithTransaction,
  updateOrderInfo,
  getOrderById,
  getAllOrders,
  getOrdersStatistics,
} from '../../services/v1/order.service.js';
import { notFound, unauthorized } from '#shared/errors/error.js';
import { ROLES } from '#shared/utils/enums.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { DtoService } from '#shared/utils/dtoService.js';

export const createOrder = async (req, res) => {
  if (!req.user) throw unauthorized();

  const order = await addOrder(req.body);

  res.status(201).json({ success: true, data: order });
};

export const updateOrder = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedOrder = await updateOrderInfo(req.params.id, req.body);

  res.status(200).json({ success: true, data: updatedOrder });
};

export const assignDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedOrder = await assignDriverToOrderWithTransaction(
    req.params.id, // order Id
    req.body.driverId
  );

  res.status(200).json({ success: true, data: updatedOrder });
};

export const pickupOrder = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedOrder = await pickupOrderWithTransaction(req.params.id, req.user);

  res.status(200).json({ success: true, data: updatedOrder });
};

export const deliverOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedOrder = await deliverOrderWithTransaction(req.params.id, req.user);

  res.status(200).json({ success: true, data: updatedOrder });
};

export const cancelOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedOrder = await cancelOrderWithTransaction(
    req.params.id,
    req.body?.cancelReason,
    req.user
  );

  res.status(200).json({ success: true, data: updatedOrder });
};

export const ordersStatistics = async (req, res) => {
  if (!req.user) throw unauthorized();

  let driverId = null;
  // If request come from driver, we find the current driver Id to ensure that driver only see his own data.
  if (req.user.role === ROLES.DRIVER) {
    const driver = await fetchDriverByUserId(req.user._id);
    if (!driver) throw notFound('driver');
    driverId = driver._id;
  }
  // Request come from admin, so we check the query parameter for driverId, if null, meaning admin want to see all orders statistics data.
  else if (req.query?.driverId) {
    driverId = req.query?.driverId;
  }

  const statistics = await getOrdersStatistics(driverId);

  res.status(200).json({ success: true, data: statistics });
};

export const getOrders = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { page, limit } = req.query;
  const searchQuery = {
    type: req.query?.type,
    priority: req.query?.priority,
    status: req.query?.status,
    driverId: req.query?.driverId,
    serviceType: req.query?.serviceType,
    serviceLevel: req.query?.serviceLevel,
    paymentType: req.query?.paymentType,
    paymentStatus: req.query?.paymentStatus,
    startDate: req.query?.startDate,
    endDate: req.query?.endDate,
  };

  const isDriver = req.user.role === ROLES.DRIVER;

  // If the request come from driver, so we inject the current driverId into the searchQuery to ensure that driver only see his own orders
  if (isDriver) {
    const driver = await fetchDriverByUserId(req.user._id);
    if (!driver) throw notFound('driver');
    searchQuery.driverId = driver._id;
  }

  let { orders, totalOrders, totalPage } = await getAllOrders(page, limit, searchQuery);

  if (isDriver) orders = orders.map((order) => DtoService.order(order));

  res.status(200).json({
    success: true,
    data: orders,
    totalOrders,
    totalPage,
  });
};

export const getOrder = async (req, res) => {
  if (!req.user) throw unauthorized();

  const order = await getOrderById(req.params.id);

  res.status(200).json({
    success: true,
    data: order,
  });
};
