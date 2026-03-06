import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import mongoose from 'mongoose';

const createBusinessCustomerSchema = z.object({
  body: z.object({
    businessId: z
      .string({ message: ERROR_CODES.REQUIRED_FIELD })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: ERROR_CODES.INVALID_ID }),

    name: z
      .string({ message: ERROR_CODES.REQUIRED_FIELD })
      .min(3, { message: ERROR_CODES.NAME_TOO_SHORT })
      .trim(),

    phone: z
      .string({ message: ERROR_CODES.REQUIRED_FIELD })
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      }),

    altPhone: z
      .string({ message: ERROR_CODES.REQUIRED_FIELD })
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    email: z
      .string({ message: ERROR_CODES.REQUIRED_FIELD })
      .email({ message: ERROR_CODES.INVALID_EMAIL_FORMAT })
      .trim(),

    addressText: z.string().trim().min(3, { message: ERROR_CODES.ADDRESS_TEXT_IS_TOO_SHORT }),

    location: z
      .object({
        type: z.literal('Point', { message: ERROR_CODES.INVALID_LOCATION_TYPE }).optional(),
        coordinates: z.preprocess(
          (val) => {
            if (!Array.isArray(val) || val.length !== 2) return val;
            return [
              ensureNumber(val[0], 'location.coordinates', ERROR_CODES.INVALID_COORDINATES),
              ensureNumber(val[1], 'location.coordinates', ERROR_CODES.INVALID_COORDINATES),
            ];
          },
          z
            .array(z.number())
            .length(2, { message: ERROR_CODES.INVALID_COORDINATES })
            .refine(([lng]) => lng >= 60 && lng <= 75, {
              message: ERROR_CODES.LNG_OUT_OF_RANGE,
            })
            .refine(([, lat]) => lat >= 29 && lat <= 39, {
              message: ERROR_CODES.LAT_OUT_OF_RANGE,
            })
        ),
      })
      .optional(),

    notes: z.string().optional(),

    tags: z.array(z.string()).optional(),
  }),
});

export const createBusinessCustomerValidator = (req) => {
  return createBusinessCustomerSchema.safeParse({ body: req.body });
};
