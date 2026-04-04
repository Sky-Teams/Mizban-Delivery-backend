import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email({ message: ERROR_CODES.INVALID_EMAIL }),
  }),
});

export const forgotPasswordValidator = (req) => {
  return forgotPasswordSchema.safeParse({ body: req.body });
};
