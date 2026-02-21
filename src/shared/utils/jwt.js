/* eslint-disable prettier/prettier */
import jwt from 'jsonwebtoken';

export const generateAccessToken = ({ id, email }) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
