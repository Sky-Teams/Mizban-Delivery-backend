import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { OAuth2Client } from 'google-auth-library';

export const verifyGoogleToken = async (id_token) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    //Verify Google ID token securely
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    return payload;
  } catch (error) {
    throw new AppError('Invalid google token', 401, ERROR_CODES.INVALID_GOOGLE_TOKEN);
  }
};
