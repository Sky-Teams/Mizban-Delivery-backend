import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { generateAccessToken } from '#shared/utils/jwt.js';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

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

export const loginService = async ({ email, password }) => {
  const user = await getUserByEmail(email);

  await validateLoginUser(user, password);

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    token: generateAccessToken(user),
  };
};

export const doesUserExist = async (fields) => {
  if (Object.keys(fields).length === 0) return false;

  const exist = await UserModel.exists(fields);
  return !!exist;
};

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
