import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  UserModel,
  hashToken,
  RefreshTokenModel,
} from '../../index.js';

export const loginService = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('Account is disabled!');

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) throw new Error('Incorrect Password');

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
