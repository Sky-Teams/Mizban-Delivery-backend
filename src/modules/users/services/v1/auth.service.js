import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../../../shared/utils/jwt.js';
import { AppError, notFound } from '../../../../shared/errors/error.js';
import { ERROR_CODES } from '../../../../shared/errors/customCodes.js';

export const loginService = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw notFound('User');
  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) throw new AppError('Invalid password', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.create({
    user: user._id,
    token: hashToken(refreshToken),
    expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    id: user._id,
    email: user.email,
    accessToken,
    refreshToken,
  };
};

export const refreshService = async (refreshCookie) => {
  if (!refreshCookie)
    throw new AppError('Unauthorized: Cookie not found', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const hashedToken = hashToken(refreshCookie);
  const storedToken = await RefreshTokenModel.findOne({ token: hashedToken }).populate(
    'user',
    '_id, email'
  );

  if (!storedToken)
    throw new AppError('Unauthorized: Token not found', 401, ERROR_CODES.INVALID_CREDENTIAL);

  if (storedToken.expireAt < new Date()) {
    await storedToken.deleteOne();
    throw new AppError('Unauthorized: Token expired', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  const newAccessToken = generateAccessToken(storedToken.user);

  return { accessToken: newAccessToken };
};
