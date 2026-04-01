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
import { AppError, notFound, unauthorized } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

//!  Helper Functions

// Register helpers
export const doesUserExist = async (fields) => {
  if (Object.keys(fields).length === 0) return false;

  const exist = await UserModel.exists(fields);
  return !!exist;
};

// Login helpers
const getUserByEmail = async (email) => {
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
// -----------

//!  Services

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

export const refreshService = async ({ refreshToken, deviceId }) => {
  const currentToken = await getStoredRefreshToken({ refreshToken, deviceId });

  const user = await getActiveUser(currentToken.user._id);

  const rotatedRefreshToken = await rotateRefreshToken(currentToken._id);

  return {
    accessToken: generateAccessToken(user),
    refreshToken: rotatedRefreshToken,
  };
};

export const getAllAdmins = async () => {
  const admins = await UserModel.find({ role: 'admin' });

  return admins;
};

export const changePasswordService = async (userId, { currentPassword, newPassword }) => {
  const user = await UserModel.findById(userId);
  if (!user) throw notFound('User');

  const psMatch = await bcrypt.compare(currentPassword, user.password);
  if (!psMatch) {
    throw new AppError('Invalid current password', 401, ERROR_CODES.INVALID_CREDENTIAL);
  }

  user.password = hashPassword(newPassword);
  user.changedPasswordAt = new Date();
  await user.save();

  await RefreshTokenModel.deleteMany({ user: user._id });
};

export const logoutUser = async ({ refreshToken, deviceId }) => {
  const hashedToken = hashToken(refreshToken);

  await RefreshTokenModel.deleteOne({ token: hashedToken, deviceId });
};
