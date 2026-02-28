import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const registerUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, { message: ERROR_CODES.MIN_LENGTH_IS_3_CHARACTERS }),
    email: z.string().email({ message: ERROR_CODES.INVALID_EMAIL }).trim().toLowerCase(),
    phone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),
    password: z
      .string()
      .trim()
      .min(6, { message: ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS }),
  }),
});

export const registerUserValidator = (req) => {
  return registerUserSchema.safeParse({ body: req.body });
};
