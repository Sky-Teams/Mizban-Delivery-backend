import jwt from 'jsonwebtoken';
import { verifyJWT, verifyServiceToken } from './jwt.js';
import { SERVICE } from './enums.js';

export const socketAuthentication = (token) => {
  const payload = jwt.decode(token);

  const isServiceToken =
    payload &&
    (payload.typo === SERVICE.MIZBAN ||
      payload.iss === SERVICE.MIZBAN ||
      payload.aud === 'delivery-service');

  if (isServiceToken) return verifyServiceToken(token);

  return verifyJWT(token);
};
