import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model.js';

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
