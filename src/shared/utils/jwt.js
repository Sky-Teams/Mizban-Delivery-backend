import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const REFRESH_TOKEN_EXPIRES_TIME = 7 * 24 * 60 * 60 * 1000;

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  secure: true,
  maxAge: REFRESH_TOKEN_EXPIRES_TIME,
};

export const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};
