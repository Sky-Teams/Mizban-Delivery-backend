import { ERROR_CODES } from '#shared/errors/customCodes.js';
import z from 'zod';

const idValidator = z.object({
  params: z.object({
    logId: z.string().uuid({ message: ERROR_CODES.INVALID_LOG_ID }),
  }),
});

export const logIdValidator = (req) => {
  return idValidator.safeParse({ params: req.params });
};
