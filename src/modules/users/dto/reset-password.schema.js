import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const resetPasswordSchema = z.object({
  params: z.object({
    resetToken: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i, { message: ERROR_CODES.INVALID_RESET_PASSWORD_TOKEN }),
  }),
  body: z.object({
    newPassword: z
      .string()
      .trim()
      .min(6, { message: ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS }),
  }),
});

export const resetPasswordValidator = (req) => {
  return resetPasswordSchema.safeParse({ body: req.body, params: req.params });
};
