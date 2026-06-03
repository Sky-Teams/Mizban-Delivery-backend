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

const reasonSchemaValidator = (fieldName) => {
  let errorCode = null;
  if (fieldName === 'cancelReason') errorCode = ERROR_CODES.INVALID_CANCEL_REASON;
  else if (fieldName === 'returnReason') errorCode = ERROR_CODES.INVALID_RETURN_REASON;

  return z.object({
    body: z.object({
      [fieldName]: z.string().trim().max(500, { message: errorCode }).nullish(),
    }),
  });
};

export const cancelOrderSchema = reasonSchemaValidator('cancelReason');
export const returnOrderSchema = reasonSchemaValidator('returnReason');

export const assignDriverValidator = (req) => {
  return assignDriverSchema.safeParse({ body: req.body });
};

export const cancelOrderValidator = (req) => {
  return cancelOrderSchema.safeParse({ body: req.body });
};

export const returnOrderValidator = (req) => {
  return returnOrderSchema.safeParse({ body: req.body });
};
