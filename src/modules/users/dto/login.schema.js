import { z } from 'zod';
import { ERROR_CODES } from '../../../shared/errors/customCodes.js';

const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .trim()
        .email({ message: ERROR_CODES.INVALID_EMAIL_FORMAT }),
      password: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .trim()
        .min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
      deviceId: z.string({ message: ERROR_CODES.REQUIRED_FIELD }).trim().min(1, {
        message: ERROR_CODES.REQUIRED_FIELD,
      }),
    })
    .strict(),
});

const refreshSchema = z.object({
  body: z
    .object({
      deviceId: z.string({ message: ERROR_CODES.REQUIRED_FIELD }).trim().min(1, {
        message: ERROR_CODES.REQUIRED_FIELD,
      }),
    })
    .strict(),
});

export const loginValidator = (req) => {
  return loginSchema.safeParse({ body: req.body });
};

export const refreshValidator = (req) => {
  return refreshSchema.safeParse({ body: req.body });
};
