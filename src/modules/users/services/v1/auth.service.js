import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '#shared/utils/jwt.js';
import {
  getActiveUser,
  getStoredRefreshToken,
  getUserByEmail,
  REFRESH_TOKEN_EXPIRES_TIME,
  rotateRefreshToken,
  validateLoginUser,
} from '#shared/utils/auth.helper.js';

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
  const currentToken = await getStoredRefreshToken({ refreshToken, deviceId });

  const user = await getActiveUser(currentToken.user._id);

  const rotatedRefreshToken = await rotateRefreshToken(currentToken._id);

  return {
    accessToken: generateAccessToken(user),
    refreshToken: rotatedRefreshToken,
  };
};
