import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '#shared/utils/jwt.js';
import { AppError, notFound, unauthorized } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

export const loginService = async ({ email, password, deviceId }) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw notFound('User');
  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) throw new AppError('Invalid password', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.findOneAndUpdate(
    { userId: user._id, deviceId },
    {
      token: hashToken(refreshToken),
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
  };
};

export const refreshService = async (req) => {
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.body.deviceId;

  if (!refreshToken || !deviceId)
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const hashedToken = hashToken(refreshToken);
  const storedToken = await RefreshTokenModel.findOne({ token: hashedToken, deviceId }).populate(
    'user',
    '_id, email'
  );

  if (!storedToken)
    throw new AppError('Unauthorized: Token not found', 401, ERROR_CODES.INVALID_CREDENTIAL);

  if (storedToken.expireAt < new Date()) {
    await storedToken.deleteOne();
    throw new AppError('Unauthorized: Token expired', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  const user = await UserModel.findById(storedToken.user._id);
  if (!user) throw unauthorized();

  await RefreshTokenModel.findOneAndUpdate(
    { userId: user._id, deviceId },
    {
      token: hashToken(generateRefreshToken()),
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const newAccessToken = generateAccessToken(storedToken.user);

  return { accessToken: newAccessToken };
};
