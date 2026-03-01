import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

const businessTyep = ['restaurant', 'shop', 'pharmacy', 'warehouse', 'other'];

const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, { message: ERROR_CODES.MIN_LENGTH_IS_3_CHARACTERS }),
    type: z.enum(businessTyep, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_BUSINESS_TYPE }),
    }),

    phone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    addressText: z.string().trim().min(3, { message: ERROR_CODES.MIN_LENGTH_IS_3_CHARACTERS }),
    location: z.object({
      type: z.literal('Point', {
        errorMap: () => ({ message: ERROR_CODES.INVALID_LOCATION_TYPE }),
      }),
      coordinates: z.array(z.number()).length(2, { message: ERROR_CODES.INVALID_COORDINATES }),
    }),

    prepTimeAvgMinutes: z
      .number()
      .int({ message: ERROR_CODES.PREP_TIME_CANNOT_BE_INTEGARE })
      .nonnegative({ message: ERROR_CODES.PREP_TIME_CANNOT_BE_NEGATIVE })
      .optional(),
  }),
});

export const createBusinessValidator = (req) => {
  return createBusinessSchema.safeParse({ body: req.body });
};
