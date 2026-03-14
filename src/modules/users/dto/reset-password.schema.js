import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const resetPasswordSchema = z
  .object({
    params: z.object({
      resetToken: z
        .string()
        .trim()
        .regex(/^[a-f0-9]{64}$/i, { message: ERROR_CODES.INVALID_TOKEN }),
    }),
    body: z.object({
      newPassword: z
        .string()
        .trim()
        .min(6, { message: ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS }),
      confirmPassword: z
        .string()
        .trim()
        .min(6, { message: ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS }),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    path: ['body', 'confirmPassword'],
    message: ERROR_CODES.PASSWORD_NOT_MATCHING,
  });

export const resetPasswordValidator = (req) => {
  return resetPasswordSchema.safeParse({ body: req.body, params: req.params });
};
