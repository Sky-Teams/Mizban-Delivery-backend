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
    status: z
      .enum(['created', 'assigned', 'pickedUp', 'delivered', 'cancelled'], {
        message: ERROR_CODES.INVALID_STATUS,
      })
      .optional(),
    type: z
      .enum(['food', 'parcel', 'grocery', 'other'], {
        message: ERROR_CODES.INVALID_DELIVERY_TYPE,
      })
      .optional(),
    priority: z
      .enum(['normal', 'high', 'critical'], {
        message: ERROR_CODES.INVALID_PRIORITY,
      })
      .optional(),
    driverId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: ERROR_CODES.INVALID_ID })
      .optional(),
    serviceType: z
      .enum(['immediate', 'scheduled'], { message: ERROR_CODES.INVALID_SERVICE_TYPE })
      .optional(),
    serviceLevel: z
      .enum(['standard', 'express'], { message: ERROR_CODES.INVALID_SERVICE_LEVEL })
      .optional(),
    paymentType: z
      .enum(['online', 'COD'], { message: ERROR_CODES.INVALID_PAYMENT_TYPE })
      .optional(),
    paymentStatus: z
      .enum(['pending', 'paid', 'failed'], {
        message: ERROR_CODES.INVALID_PAYMENT_STATUS,
      })
      .optional(),
  }),
});

export const orderQueryValidator = (req) => {
  return queryValidator.safeParse({ query: req.query });
};
