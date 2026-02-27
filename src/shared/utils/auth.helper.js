import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

export const getDeviceId = (req) => {
  const deviceId = req.body?.deviceId;

  if (!deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  return deviceId;
};
