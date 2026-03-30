import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const changePasswordSchema = z
  .object({
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
        confirmNewPassword: z
          .string({ message: ERROR_CODES.REQUIRED_FIELD })
          .trim()
          .min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
      })
      .strict(),
  })
  .superRefine(({ body }, ctx) => {
    if (body.newPassword !== body.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_CODES.PASSWORDS_NOT_MATCHES,
        path: ['body', 'confirmNewPassword'],
      });
    }
  });

export const changePasswordValidator = (req) => {
  return changePasswordSchema.safeParse({ body: req.body });
};
