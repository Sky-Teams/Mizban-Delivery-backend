import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

const createBusinessCustomerService = z.object({
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
  }),
});
