import { notFound, unauthorized } from '#shared/errors/error.js';
import { createNewDriver, doesDriverExist } from '../../services/v1/driver.service.js';

export const createDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await doesDriverExist(req.user._id);
  if (!exist) throw new notFound('User');

  const driver = await createNewDriver(req.user._id, req.body);
  res.status(201).json({ success: true, data: driver });
};
