import { z } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const notificationTypes = ['SYSTEM', 'PAYMENT', 'ORDER', 'NO-DRIVER'];

export const createNotificationSchema = z.object({
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_USER_ID,
  }),
  type: z
    .string()
    .refine((val) => notificationTypes.includes(val), {
      message: ERROR_CODES.INVALID_NOTIFICATION_TYPE,
    })
    .optional(),
  title: z
    .string({
      message: ERROR_CODES.TITLE_REQUIRED,
    })
    .min(1, { message: ERROR_CODES.TITLE_REQUIRED })
    .max(100, { message: ERROR_CODES.TITLE_TOO_LONG }),
  message: z.string().max(500, { message: ERROR_CODES.MESSAGE_TOO_LONG }).optional(),
});
