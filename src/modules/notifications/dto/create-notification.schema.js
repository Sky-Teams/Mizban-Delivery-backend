import { z } from 'zod';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const notificationTypes = ['system', 'payment', 'delivery_update'];

export const createNotificationSchema = z.object({
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: ERROR_CODES.INVALID_USER_ID,
  }),
  type: z
    .enum(notificationTypes, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_NOTIFICATION_TYPE }),
    })
    .optional(),
  title: z
    .string({
      required_error: ERROR_CODES.TITLE_REQUIRED,
    })
    .min(1, { message: ERROR_CODES.TITLE_REQUIRED })
    .max(100, { message: ERROR_CODES.TITLE_TOO_LONG }),
  message: z.string().max(500, { message: ERROR_CODES.MESSAGE_TOO_LONG }).optional(),
});

// We can use it in future if needed, so for now we dont need it to use as a validator in notification routes.
// export const createNotificationValidator = (req) => {
//   return createNotificationSchema.safeParse({ body: req.body }); // Change the body to another thing
// };
