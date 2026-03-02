import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';

const businessTyep = ['restaurant', 'shop', 'pharmacy', 'warehouse', 'other'];

const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),

    type: z.enum(businessTyep, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_BUSINESS_TYPE }),
    }),

    phone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    addressText: z.string().trim().min(3, { message: ERROR_CODES.LENGTH_IS_TOO_SHORT }),
    location: z
      .object({
        type: z.literal('Point', {
          message: ERROR_CODES.INVALID_LOCATION_TYPE,
        }),
        coordinates: z.preprocess(
          (val) => {
            if (!Array.isArray(val) || val.length !== 2) return val;
            return [
              ensureNumber(val[0], 'location.coordinates', ERROR_CODES.INVALID_COORDINATES),
              ensureNumber(val[1], 'location.coordinates', ERROR_CODES.INVALID_COORDINATES),
            ];
          },
          z.tuple([
            z
              .number()
              .min(60, { message: ERROR_CODES.LNG_OUT_OF_RANGE }) //Longitude range for Afghanistan
              .max(75, { message: ERROR_CODES.LNG_OUT_OF_RANGE }),
            z
              .number()
              .min(29, { message: ERROR_CODES.LAT_OUT_OF_RANGE }) // Latitude range for Afghanistan
              .max(39, { message: ERROR_CODES.LAT_OUT_OF_RANGE }),
          ])
        ),
      })
      .optional(),

    prepTimeAvgMinutes: z
      .preprocess(
        (val) => ensureNumber(val, 'prepTimeAvgMinutes', ERROR_CODES.PREP_TIME_MUST_BE_INTEGARE),
        z
          .number()
          .int({ message: ERROR_CODES.PREP_TIME_MUST_BE_INTEGARE })
          .positive({ message: ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE })
      )
      .optional(),
  }),
});

export const createBusinessValidator = (req) => {
  return createBusinessSchema.safeParse({ body: req.body });
};
