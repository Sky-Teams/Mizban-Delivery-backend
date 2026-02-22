import { generateAccessToken, hashToken } from '../../../../shared/utils/jwt.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';

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
