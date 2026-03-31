import { cookieOptions } from '#shared/utils/jwt.js';
import { ensureDeviceId, getDeviceId } from '#shared/utils/auth.helper.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import {
  forgotPasswordService,
  loginService,
  refreshService,
  resetPasswordService,
  verifyUserEmail,
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  await forgotPasswordService({ email });

  res.status(200).json({
    success: true,
    message: 'Email sent',
  });
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword, confirmPassword } = req.body;

  await resetPasswordService({ resetToken, newPassword, confirmPassword });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
};

export const verifyEmail = async (req, res) => {
  const { verifyToken } = req.params;

  await verifyUserEmail(verifyToken);

  res.status(200).json({
    success: true,
    message: 'Your email verified successfully',
  });
};
