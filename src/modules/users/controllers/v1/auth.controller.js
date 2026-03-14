import { cookieOptions, hashToken } from '#shared/utils/jwt.js';
import { ensureDeviceId, getDeviceId } from '#shared/utils/auth.helper.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { getUserByEmail, loginService, refreshService } from '../../services/v1/auth.service.js';
import { doesUserExist, registerUser } from '../../services/v1/auth.service.js';
import { UserModel } from '#modules/users/models/user.model.js';
import bcrypt from 'bcryptjs';
import { agenda } from '../../../../config/agenda.js';

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

  const user = await getUserByEmail(email);
  if (!user) throw notFound('User');

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:3000/api/auth/reset-password/${resetToken}`;

  await agenda.now('send-reset-password-email', {
    email: user.email,
    username: user.name,
    resetUrl,
  });

  res.status(200).json({
    success: true,
    message: 'Email sent',
  });
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword, confirmPassword } = req.body;

  const user = await UserModel.findOne({
    passwordResetToken: hashToken(resetToken),
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) throw new AppError('Invalid or expired token', 400, ERROR_CODES.INVALID_TOKEN);

  if (newPassword !== confirmPassword)
    throw new AppError('Password not match', 400, ERROR_CODES.PASSWORD_NOT_MATCHING);

  const newPasswordHashed = await bcrypt.hash(newPassword, 12);

  await user
    .set({
      password: newPasswordHashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
};
