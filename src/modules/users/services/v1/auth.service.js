import bcrypt from 'bcryptjs';
import { AppError } from '../../../../shared/errors/error.js';
import { UserModel } from '../../models/user.model.js';
import { ERROR_CODES } from '../../../../shared/errors/customCodes.js';

export const registerService = async (data) => {
  const { email, name, phone, password } = data;

  const existingUser = await UserModel.exists({ email });
  if (existingUser) throw new AppError('Email already exists', 400, ERROR_CODES.DUPLICATE);

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
