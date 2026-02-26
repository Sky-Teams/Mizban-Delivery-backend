import { ERROR_CODES } from '../errors/customCodes.js';
import { AppError } from '../errors/error.js';

export const getDeviceId = (req) => {
  const { deviceId } = req.body;

  if (!deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  return deviceId;
};
