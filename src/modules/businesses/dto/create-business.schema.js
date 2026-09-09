import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { createGeoPointSchema } from '#shared/utils/dto.helper.js';

const businessType = ['restaurant', 'shop', 'pharmacy', 'warehouse', 'other'];

const createBusinessSchema = z.object({
  body: z.object({
    username: z
      .string({ message: ERROR_CODES.NAME_TOO_SHORT })
      .trim()
      .min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),

    email: z.string().email({ message: ERROR_CODES.INVALID_EMAIL }).trim().toLowerCase(),

    userPhoneNumber: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    name: z.string().trim().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),

    type: z.enum(businessType, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_BUSINESS_TYPE }),
    }),

    phone: z.string().refine((val) => isValidPhoneNumber(val, 'AF'), {
      message: ERROR_CODES.INVALID_PHONE_NUMBER,
    }),

    addressText: z.string().trim(),
    location: createGeoPointSchema().optional(),

    prepTimeAvgMinutes: z
      .preprocess(
        (val) => ensureNumber(val, 'prepTimeAvgMinutes', ERROR_CODES.PREP_TIME_MUST_BE_INTEGER),
        z
          .number()
          .int({ message: ERROR_CODES.PREP_TIME_MUST_BE_INTEGER })
          .positive({ message: ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE })
      )
      .optional(),
  }),
});

export const createBusinessValidator = (req) => {
  return createBusinessSchema.safeParse({ body: req.body });
};
