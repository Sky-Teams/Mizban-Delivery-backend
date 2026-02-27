import { UserModel } from '../../models/user.model.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '#shared/utils/jwt.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { getUserByEmail, validateLoginUser } from '#shared/utils/auth.helper.js';

const REFRESH_TOKEN_EXPIRES_TIME = 7 * 24 * 60 * 60 * 1000;

export const loginService = async ({ email, password }, deviceId) => {
  const user = await getUserByEmail(email);

  await validateLoginUser(user, password);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.findOneAndUpdate(
    { user: user._id, deviceId },
    {
      token: hashToken(refreshToken),
      expireAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_TIME),
    },
    {
      upsert: true, // if exist update, otherwise insert
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true, // Apply default schema values when a new document is inserted
    }
  );

  return {
    id: user._id,
    email: user.email,
    accessToken,
    refreshToken,
    role: user.role,
  };
};

export const refreshService = async ({ refreshToken, deviceId }) => {
  if (!refreshToken || !deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  // 1) Validate current refresh token
  const currentToken = await RefreshTokenModel.findOne({
    token: hashToken(refreshToken),
    deviceId,
  }).populate('user', '_id email');

  if (!currentToken) throw new AppError('Token not found', 401, ERROR_CODES.INVALID_CREDENTIAL);
  if (currentToken.expireAt < new Date()) {
    await currentToken.deleteOne();
    throw new AppError('Token expired', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  // 2) Check user existence
  const user = await UserModel.findById(currentToken.user._id);
  if (!user) throw unauthorized();

  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  // 3) Rotate refresh token
  const newRefreshToken = generateRefreshToken();
  const newHashedToken = hashToken(newRefreshToken);

  await RefreshTokenModel.findOneAndUpdate(
    { _id: currentToken._id },
    {
      token: newHashedToken,
      expireAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_TIME),
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // 4) Generate and return new access token
  const accessToken = generateAccessToken(user);
  return { accessToken, refreshToken: newRefreshToken };
};
