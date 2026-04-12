import {
  assignDriverToOrderWithTransaction,
  cancelOrderWithTransaction,
  addOrder,
  deliverOrderWithTransaction,
  pickupOrderWithTransaction,
  updateOrderInfo,
  getOrderById,
  getAllOrders,
} from '../../services/v1/order.service.js';
import { unauthorized } from '#shared/errors/error.js';

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

  const updatedOrder = await pickupOrderWithTransaction(req.params.id);

  res.status(200).json({ success: true, data: updatedOrder });
};

export const deliverOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedOrder = await deliverOrderWithTransaction(req.params.id);

  res.status(200).json({ success: true, data: updatedOrder });
};

export const cancelOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedOrder = await cancelOrderWithTransaction(req.params.id, req.body?.cancelReason);

  res.status(200).json({ success: true, data: updatedOrder });
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

  const { orders, totalOrders, totalPage } = await getAllOrders(page, limit, searchQuery);

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
