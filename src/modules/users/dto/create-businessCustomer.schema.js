import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { ensureISODate } from '#shared/utils/ensureISODate.js';

const createBusinessCustomerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_filed: ERROR_CODES.REQUIRED_FIELD })
      .min(3, { message: ERROR_CODES.TOO_SHORT })
      .trim(),

    phone: z
      .string({ required_filed: ERROR_CODES.REQUIRED_FIELD })
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      }),

    altPhone: z.string().trim().optional(),

    addressText: z.string().trim(),

    location: z.object({
      type: z.literal('point').optional(),

      coordinates: z.preprocess(
        (val) => {
          if (!Array.isArray(val) || val.length !== 2) return val;
          return val.map((v, i) =>
            ensureNumber(v, `location.coordinates[${i}]`, ERROR_CODES.INVALID_COORDINATES)
          );
        },
        z.array(z.number()).length(2, { message: ERROR_CODES.INVALID_COORDINATES })
      ),
    }),

    notes: z.string().optional(),

    tags: z.array(),

    lastOrderedAt: z.preprocess(
      (val) =>
        val ? ensureISODate(val, ERROR_CODES.INVALID_ISO_DATE_FORMAT, 'lastOrderedAt') : undefined,
      z.date()
    ),

    totalOrders: z.number().optional(),
  }),
});

export const createBusinessCustomerValidator = (req) => {
  return createBusinessCustomerSchema.safeParse({ body: req.body });
};
