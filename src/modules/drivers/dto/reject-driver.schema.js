import { ERROR_CODES } from '#shared/errors/customCodes.js';
import z from 'zod';

const rejectDriverSchema = z.object({
  body: z.object({
    rejectReason: z.string().min(1, ERROR_CODES.REJECT_REASON_REQUIRED),
  }),
});

export const rejectDriverValidator = (req) => {
  return rejectDriverSchema.safeParse({ body: req.body });
};
