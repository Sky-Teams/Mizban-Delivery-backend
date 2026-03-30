import { z } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

export const createOderOfferSchema = z.object({
  order: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_ORDER_ID,
  }),
  driver: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_DRIVER_ID,
  }),
});
