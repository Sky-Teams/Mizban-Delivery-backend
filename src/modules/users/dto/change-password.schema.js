import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .trim()
        .min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
      newPassword: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .trim()
        .min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
    })
    .strict(),
});

export const changePasswordValidator = (req) => {
  return changePasswordSchema.safeParse({ body: req.body });
};
