import { z } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const IdValidator = z.object({
  params: z.object({
    id: z.string().transform((val) => {
      if (!mongoose.Types.ObjectId.isValid(val)) {
        throw new AppError('Invalid ID format', 400, ERROR_CODES.INVALID_ID);
      }
      return val;
    }),
  }),
});

/* Validate mongodb objectId */
export const mongoIdValidator = (req) => {
  return IdValidator.safeParse({ params: req.params });
};
