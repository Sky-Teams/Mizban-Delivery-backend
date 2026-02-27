// src/shared/utils/auth.helper.js
import { randomUUID } from 'crypto';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { cookieOptions } from '#shared/utils/jwt.js';

export const getDeviceId = (req) => {
  const deviceId = req.cookies?.deviceId;
  if (!deviceId) {
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }
  return deviceId;
};

export const ensureDeviceId = (req, res) => {
  const existingDeviceId = req.cookies?.deviceId;
  if (existingDeviceId) return existingDeviceId;

  const newDeviceId = randomUUID();
  res.cookie('deviceId', newDeviceId, cookieOptions);
  return newDeviceId;
};
