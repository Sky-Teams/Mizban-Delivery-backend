import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { generateAccessToken } from '../../../../shared/utils/jwt.js';
import { AppError } from '../../../../shared/errors/error.js';
import { ERROR_CODES } from '../../../../shared/errors/customCodes.js';

export const loginService = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch)
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIAL);

  if (!user.isActive) throw new AppError('Account is disabled!', 403, ERROR_CODES.ACCOUNT_DISABLED);

  const token = generateAccessToken(user);

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    token,
  };
};
