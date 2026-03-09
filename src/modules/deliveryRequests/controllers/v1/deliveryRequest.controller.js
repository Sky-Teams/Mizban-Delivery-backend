import {
  assignDriverToDeliveryRequest,
  cancelDeliveryRequest,
  createDeliveryRequest,
  deliverDeliveryRequest,
  pickupDeliveryRequest,
  updateDeliveryRequestInfo,
} from '../../services/v1/deliveryRequest.service.js';
import { unauthorized } from '#shared/errors/error.js';

export const createDelivery = async (req, res) => {
  if (!req.user) throw unauthorized();

  const deliveryRequest = await createDeliveryRequest(req.body);

  res.status(201).json({ success: true, data: deliveryRequest });
};

export const updateDeliveryRequest = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedDeliveryRequest = await updateDeliveryRequestInfo(req.params.id, req.body);

  res.status(200).json({ success: true, data: updatedDeliveryRequest });
};

export const assignDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedDeliveryRequest = await assignDriverToDeliveryRequest(
    req.params.id, // deliveryRequest Id
    req.body.driverId
  );

  res.status(200).json({ success: true, data: updatedDeliveryRequest });
};

export const pickupOrder = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedDeliveryRequest = await pickupDeliveryRequest(req.params.id);

  res.status(200).json({ success: true, data: updatedDeliveryRequest });
};

export const deliverOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedDeliveryRequest = await deliverDeliveryRequest(req.params.id);

  res.status(200).json({ success: true, data: updatedDeliveryRequest });
};

export const cancelOrder = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedDeliveryRequest = await cancelDeliveryRequest(req.params.id, req.body?.cancelReason);

  res.status(200).json({ success: true, data: updatedDeliveryRequest });
};
