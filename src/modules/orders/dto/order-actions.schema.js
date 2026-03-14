import { z } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

export const assignDriverSchema = z.object({
  body: z.object({
    driverId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: ERROR_CODES.INVALID_DRIVER_ID,
    }),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    cancelReason: z
      .string()
      .trim()
      .max(500, { message: ERROR_CODES.INVALID_CANCEL_REASON })
      .nullish(),
  }),
});

export const assignDriverValidator = (req) => {
  return assignDriverSchema.safeParse({ body: req.body });
};

export const cancelOrderValidator = (req) => {
  return cancelOrderSchema.safeParse({ body: req.body });
};
