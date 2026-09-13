import jwt from 'jsonwebtoken';
import { verifyJWT, verifyServiceToken } from './jwt.js';
import { SERVICES } from './enums.js';

export const socketAuthentication = (token) => {
  const payload = jwt.decode(token);

  const isServiceToken =
    payload &&
    (payload.typo === SERVICES.MIZBAN ||
      payload.iss === SERVICES.MIZBAN ||
      payload.aud === 'delivery-service');

  if (isServiceToken) return verifyServiceToken(token);

  return verifyJWT(token);
};
