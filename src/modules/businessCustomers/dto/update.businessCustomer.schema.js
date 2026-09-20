import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { createGeoPointSchema } from '#shared/utils/dto.helper.js';

const updateBusinessCustomerSchema = z.object({
  body: z
    .object({
      name: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .trim()
        .min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),

      phone: z
        .string()
        .trim()
        .refine((val) => isValidPhoneNumber(val, 'AF'), {
          message: ERROR_CODES.INVALID_PHONE_NUMBER,
        }),

      email: z
        .string({ message: ERROR_CODES.REQUIRED_FIELD })
        .email({ message: ERROR_CODES.INVALID_EMAIL_FORMAT })
        .trim(),

      altPhone: z
        .string()
        .trim()
        .refine((val) => isValidPhoneNumber(val, 'AF'), {
          message: ERROR_CODES.INVALID_PHONE_NUMBER,
        }),

      addressText: z.string().trim(),

      location: createGeoPointSchema().optional(),

      notes: z.string().trim(),
      tags: z.array(z.string()),
      isActive: z.boolean(),
    })
    .partial(),
});

export const updateBusinessCustomerValidator = (req) => {
  return updateBusinessCustomerSchema.safeParse({ body: req.body });
};
