import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { DEVICES } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';

const registerDeviceSchema = z.object({
  body: z.object({
    fcmToken: z.string().trim().min(10, { message: ERROR_CODES.INVALID_FCM_TOKEN }),
    platform: z.enum(getObjectValues(DEVICES), {
      errorMap: () => ({ message: ERROR_CODES.INVALID_DEVICE_PLATFORM }),
    }),
    deviceId: z.string().trim().min(5, { message: ERROR_CODES.INVALID_DEVICE_ID }),
  }),
});

export const registerDeviceValidator = (req) => {
  return registerDeviceSchema.safeParse({ body: req.body });
};

const UpdateDeviceSchema = z.object({
  params: z.object({
    deviceId: z.string().trim().min(5, { message: ERROR_CODES.INVALID_DEVICE_ID }),
  }),
  body: z
    .object({
      fcmToken: z.string().trim().min(10).optional(),
      platform: z.enum(getObjectValues(DEVICES)).optional(),
    })
    .refine((data) => data.fcmToken || data.platform, {
      message: ERROR_CODES.NO_FIELDS_PROVIDED,
    }),
});

export const updateDeviceValidator = (req) => {
  return UpdateDeviceSchema.safeParse({
    params: req.params,
    body: req.body,
  });
};
