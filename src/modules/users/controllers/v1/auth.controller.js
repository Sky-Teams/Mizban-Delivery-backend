import { cookieOptions } from '#shared/utils/jwt.js';
import { ensureDeviceId, getDeviceId } from '#shared/utils/auth.helper.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import {
  changePasswordService,
  loginService,
  logoutUser,
  refreshService,
} from '../../services/v1/auth.service.js';
import { doesUserExist, registerUser } from '../../services/v1/auth.service.js';

export const register = async (req, res) => {
  const data = req.body;

  const emailExist = await doesUserExist({ email: data.email });
  if (emailExist) throw new AppError('Email already exists', 400, ERROR_CODES.DUPLICATE);

  await registerUser(data);

  res.status(200).json({
    success: true,
    message: 'User registered successfully',
  });
};

export const login = async (req, res) => {
  const deviceId = ensureDeviceId(req, res);

  const { accessToken, refreshToken, id, email, role } = await loginService(req.body, deviceId);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: { token: accessToken, id, email, role },
  });
};

export const refreshAccessToken = async (req, res) => {
  const deviceId = getDeviceId(req);
  const refreshToken = req.cookies?.refreshToken;

  const { accessToken, refreshToken: rotatedRefreshToken } = await refreshService({
    refreshToken,
    deviceId,
  });

  res.cookie('refreshToken', rotatedRefreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: { token: accessToken },
  });
};

export const changePassword = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  await changePasswordService(req.user._id, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const deviceId = req.cookies?.deviceId;

  if (!refreshToken || !deviceId)
    throw new AppError('Invalid session data for logout', 401, ERROR_CODES.LOGOUT_INVALID_SESSION);

  await logoutUser({ refreshToken, deviceId });

  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('deviceId', cookieOptions);

  res.status(200).json({
    success: true,
    message: 'User logout successfully',
  });
};
