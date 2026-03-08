import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';

const businessType = ['restaurant', 'shop', 'pharmacy', 'warehouse', 'other'];

const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),

    type: z.enum(businessType, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_BUSINESS_TYPE }),
    }),

    phone: z.string().refine((val) => isValidPhoneNumber(val, 'AF'), {
      message: ERROR_CODES.INVALID_PHONE_NUMBER,
    }),

    addressText: z.string().trim().min(3, { message: ERROR_CODES.LENGTH_IS_TOO_SHORT }),
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
