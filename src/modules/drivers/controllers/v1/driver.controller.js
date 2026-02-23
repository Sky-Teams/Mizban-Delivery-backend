import { AppError, unauthorized } from '#shared/errors/error.js';
import { createNewDriver, doesDriverExist } from '../../services/v1/driver.service.js';

export const createDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await doesDriverExist(req.user._id);
  if (exist) throw new AppError('Driver already exist', 400, ERROR_CODES.DRIVER_ALREADY_EXIST);

  const driver = await createNewDriver(req.user._id, req.body);
  res.status(201).json({ success: true, data: driver });
};
