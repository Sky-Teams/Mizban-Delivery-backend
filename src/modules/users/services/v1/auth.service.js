import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { RefreshTokenModel } from '../../models/refreshToken.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  REFRESH_TOKEN_EXPIRES_TIME,
} from '#shared/utils/jwt.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { agenda } from '../../../../config/agenda.js';

//!  Helper Functions

// Register helpers
export const doesUserExist = async (fields) => {
  if (Object.keys(fields).length === 0) return false;

  const exist = await UserModel.exists(fields);
  return !!exist;
};

// Login helpers
export const getUserByEmail = async (email) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }
  return user;
};

const validateLoginUser = async (user, password) => {
  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);
  }
};

// Refresh helpers
const getStoredRefreshToken = async ({ refreshToken, deviceId }) => {
  if (!refreshToken || !deviceId) {
    throw new AppError('Unauthorized: Invalid credential', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  const currentToken = await RefreshTokenModel.findOne({
    token: hashToken(refreshToken),
    deviceId,
  }).populate('user', '_id email');

  if (!currentToken) {
    throw new AppError('Token not found', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  if (currentToken.expireAt < new Date()) {
    await currentToken.deleteOne();
    throw new AppError('Token expired', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  return currentToken;
};

const getActiveUser = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw unauthorized();

  if (!user.isActive) {
    throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);
  }

  return user;
};

const rotateRefreshToken = async (currentTokenId) => {
  const newRefreshToken = generateRefreshToken();

  await RefreshTokenModel.findOneAndUpdate(
    { _id: currentTokenId },
    {
      token: hashToken(newRefreshToken),
      expireAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_TIME),
    },
    { new: true, runValidators: true }
  );

  return newRefreshToken;
};

// Forgot password helpers
const findUserByResetToken = async (resetToken) => {
  const user = await UserModel.findOne({
    passwordResetToken: hashToken(resetToken),
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) throw new AppError('Invalid or expired token', 400, ERROR_CODES.INVALID_TOKEN);

  return user;
};

//!  Services

// Register
export const registerUser = async (data) => {
  const { email, name, phone, password } = data;

  const hashPassword = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    name,
    email,
    phone,
    password: hashPassword,
  });

  return {
    id: user._id,
    email: user.email,
  };
};

// Login
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
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
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

// Refresh Token
export const refreshService = async ({ refreshToken, deviceId }) => {
  const currentToken = await getStoredRefreshToken({ refreshToken, deviceId });

  const user = await getActiveUser(currentToken.user._id);

  const rotatedRefreshToken = await rotateRefreshToken(currentToken._id);

  return {
    accessToken: generateAccessToken(user),
    refreshToken: rotatedRefreshToken,
  };
};

// Forgot Password
export const forgotPasswordService = async ({ email }) => {
  const user = await getUserByEmail(email);

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await agenda.now('send-reset-password-email', {
    email: user.email,
    username: user.name,
    resetUrl,
  });

  return { resetUrl };
};

// Reset Password
export const resetPasswordService = async ({ resetToken, newPassword }) => {
  const user = await findUserByResetToken(resetToken);

  user.set({
    password: hashPassword(newPassword),
    passwordResetToken: null,
    passwordResetExpires: null,
    changedPasswordAt: new Date(Date.now()),
  });

  await user.save();

  await RefreshTokenModel.deleteMany({ user: user._id });
};

export const getAllAdmins = async () => {
  const admins = await UserModel.find({ role: 'admin' });

  return admins;
};
