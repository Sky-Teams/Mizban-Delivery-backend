import z from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import mongoose from 'mongoose';

const queryValidator = z.object({
  query: z.object({
    driverId: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === '') return undefined;
        return val;
      })
      .refine(
        (val) => {
          if (!val) return true;
          return mongoose.Types.ObjectId.isValid(val);
        },
        {
          message: ERROR_CODES.INVALID_DRIVER_ID,
        }
      ),
  }),
});

export const orderStatisticsQueryValidator = (req) => {
  return queryValidator.safeParse({ query: req.query });
};
