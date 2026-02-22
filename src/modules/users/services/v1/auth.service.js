import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import { generateAccessToken } from '../../../../shared/utils/jwt.js';
import { AppError } from '../../../../shared/errors/error.js';
import { ERROR_CODES } from '../../../../shared/errors/customCodes.js';

export const loginService = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });

  const psMatch = await bcrypt.compare(password, user.password);
  if (!user || !psMatch)
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);

  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.create({
    user: user._id,
    token: hashToken(refreshToken),
    expireAt: new Date(Date.now() + 7 * 60 * 60 * 1000),
  });

  return {
    id: user._id,
    email: user.email,
    accessToken,
    refreshToken,
  };
};

export const refreshService = async (refreshCookie) => {
  if (!refreshCookie) throw new Error('Token not found');

  const hashToken = hashToken(refreshCookie);
  const storedToken = await RefreshTokenModel.findOne({ token: hashToken });

  if (!storedToken) throw new Error('Token not found');
  if (storedToken.expireAt < new Date()) {
    await storedToken.deleteOne();
    throw new Error('Token not found');
  }

  const newAccessToken = generateAccessToken(storedToken.user);

  return { accessToken: newAccessToken };
};
