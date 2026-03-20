import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';
import z from 'zod';

const queryValidator = z.object({
  query: z.object({
    page: z.coerce
      .number({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_INTEGER })
      .int({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_INTEGER })
      .positive({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_POSITIVE })
      .optional(),
    limit: z.coerce
      .number({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_INTEGER })
      .int({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_INTEGER })
      .positive({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_POSITIVE })
      .optional(),
    isActive: z
      .preprocess(
        (val) => (val === 'false' ? false : val === 'true' ? false : val),
        z.boolean({ message: ERROR_CODES.INVALID_BOOLEAN_TYPE })
      )
      .optional(),
    sort: z
      .enum(['top', 'latest'], {
        message: ERROR_CODES.INVALID_SORT_OPTION,
      })
      .optional(),
    businessId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: ERROR_CODES.INVALID_ID })
      .optional(),
  }),
});

export const queriesValidator = (req) => {
  return queryValidator.safeParse({ query: req.query });
};
