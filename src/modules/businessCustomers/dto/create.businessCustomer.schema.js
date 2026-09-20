import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import mongoose from 'mongoose';
import { createGeoPointSchema } from '#shared/utils/dto.helper.js';

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

    addressText: z.string().trim(),

    location: createGeoPointSchema().optional(),

    notes: z.string().optional(),

    tags: z.array(z.string()).optional(),
  }),
});

export const createBusinessCustomerValidator = (req) => {
  return createBusinessCustomerSchema.safeParse({ body: req.body });
};
