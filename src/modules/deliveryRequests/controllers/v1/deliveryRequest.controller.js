import { createDeliveryRequest } from '../../services/v1/deliveryRequest.service.js';
import { unauthorized } from '#shared/errors/error.js';

export const createDelivery = async (req, res) => {
  if (!req.user) throw unauthorized();

  const deliveryRequest = await createDeliveryRequest(req.body);

  res.status(201).json({ success: true, data: deliveryRequest });
};
