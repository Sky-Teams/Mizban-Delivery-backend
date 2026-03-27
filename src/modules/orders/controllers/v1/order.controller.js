import {
  assignDriverToOrderWithTransaction,
  cancelOrderWithTransaction,
  addOrder,
  deliverOrderWithTransaction,
  pickupOrderWithTransaction,
  updateOrderInfo,
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
