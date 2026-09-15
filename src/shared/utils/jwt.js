import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { SERVICE } from '#shared/utils/enums.js';

const validateMizbanPublicKey = () => {
  const MIZBAN_SERVICE_PUBLIC_KEY = process.env.MIZBAN_SERVICE_PUBLIC_KEY?.trim().replace(
    /\\n/g,
    '\n'
  );

  if (!MIZBAN_SERVICE_PUBLIC_KEY)
    throw new AppError(
      'MIZBAN_SERVICE_PUBLIC_KEY is not set in the environment',
      500,
      'MIZBAN_SERVICE_PUBLIC_KEY_IS_NOT_SET'
    );

  return MIZBAN_SERVICE_PUBLIC_KEY;
};

export const REFRESH_TOKEN_EXPIRES_TIME = 7 * 24 * 60 * 60 * 1000;

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: REFRESH_TOKEN_EXPIRES_TIME,
};

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
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

export const generateRandomPassword = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify service token
export const verifyServiceToken = (token) => {
  const publicKey = validateMizbanPublicKey();

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'mizban',
      audience: 'delivery-service',
    });

    if (decoded.sub !== SERVICE.MIZBAN || decoded.type !== 'service')
      throw new AppError('Invalid token', 401, ERROR_CODES.INVALID_TOKEN);

    return decoded;
  } catch {
    throw new AppError('Invalid token', 401, ERROR_CODES.INVALID_TOKEN);
  }
};
