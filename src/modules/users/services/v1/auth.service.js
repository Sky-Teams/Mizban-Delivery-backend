import bcrypt from 'bcryptjs';
import { generateAccessToken, hashToken } from '../../../../shared/utils/jwt.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import { UserModel } from '../../models/user.model.js';

export const refreshService = async (refreshCookie) => {
  if (!refreshCookie) throw new Error('Token not found');

  const hashedToken = hashToken(refreshCookie);
  const storedToken = await RefreshTokenModel.findOne({ token: hashedToken });

  if (!storedToken) throw new Error('Token not found');
  if (storedToken.expireAt < new Date()) {
    await storedToken.deleteOne();
    throw new Error('Token not found');
  }

  const newAccessToken = generateAccessToken(storedToken.user);

  return { accessToken: newAccessToken };
};

export const login = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('Account is disabled!');

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) throw new Error('Incorrect Password');

  const token = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
  });

  return {
    id: user._id,
    email: user.email,
    token,
  };
};
