import bcrypt from 'bcryptjs';
import { UserModel } from '#modules/users/models/user.model.js';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { RefreshTokenModel } from '#modules/users/models/refreshToken.model.js';
import { generateRefreshToken } from '#shared/utils/jwt.js';

export const REFRESH_TOKEN_EXPIRES_TIME = 7 * 24 * 60 * 60 * 1000;

// --------------------
// loginService helpers

export const getDeviceId = (req) => {
  const deviceId = req.body?.deviceId;

  if (!deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  return deviceId;
};

export const getUserByEmail = async (email) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  return user;
};

export const validateLoginUser = async (user, password) => {
  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);
};

// --------------------
// refreshService helpers

export const getStoredRefreshToken = async (refreshToken, deviceId) => {
  if (!refreshToken || !deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const currentToken = await RefreshTokenModel.findOne({
    token: hashToken(refreshToken),
    deviceId,
  }).populate('user', '_id email');

  if (!currentToken) throw new AppError('Token not found', 401, ERROR_CODES.INVALID_CREDENTIAL);
  if (currentToken.expireAt < new Date()) {
    await currentToken.deleteOne();
    throw new AppError('Token expired', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  return currentToken;
};

export const getActiveUser = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw unauthorized();

  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  return user;
};

export const rotateRefreshToken = async (currentTokenId) => {
  const newRefreshToken = generateRefreshToken();

  await RefreshTokenModel.findOneAndUpdate(
    { _id: currentTokenId },
    {
      token: hashToken(newRefreshToken),
      expireAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_TIME),
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return newRefreshToken;
};
