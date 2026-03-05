import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};
