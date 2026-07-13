import { z } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { OFFER_STATUS } from '#shared/utils/enums.js';

export const createOfferSchema = z.object({
  order: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_ORDER_ID,
  }),
  driver: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_DRIVER_ID,
  }),
  metadata: z.any(),
});

export const queryValidator = z.object({
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
    status: z
      .enum(OFFER_STATUS, {
        message: ERROR_CODES.INVALID_STATUS,
      })
      .optional(),
  }),
});

export const OfferQueryValidator = (req) => {
  return queryValidator.safeParse({ query: req.query });
};
