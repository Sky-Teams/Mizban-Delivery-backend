import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';
import { generateAccessToken } from '../../../../shared/utils/jwt.js';

export const loginService = async ({ email, password }) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('Account is disabled!');

  const psMatch = await bcrypt.compare(password, user.password);
  if (!psMatch) throw new Error('Incorrect Password');

  const token = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
  });

  return {
    id: user._id,
    email: user.email,
    token,
  };
};
