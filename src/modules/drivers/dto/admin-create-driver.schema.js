import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

const vehicleTypes = ['bike', 'car', 'van'];
const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const adminCreateDriverSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),
    email: z.string().email({ message: ERROR_CODES.INVALID_EMAIL }).trim().toLowerCase(),
    phone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),
    vehicleType: z.enum(vehicleTypes, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
    }),

    status: z
      .enum(driverStatuses, {
        errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }),
      })
      .optional(),

    vehicleRegistrationNumber: z
      .string()
      .min(1, { message: ERROR_CODES.VEHICLE_REGISTRATION_REQUIRED }),

    address: z.string().optional().nullable(),

    capacity: z.object({
      maxWeightKg: z.preprocess(
        (val) => ensureNumber(val, 'capacity.maxWeightKg', ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER),
        z.number().positive({ message: ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE })
      ),

      maxPackages: z.preprocess(
        (val) => ensureNumber(val, 'capacity.maxPackages', ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER),
        z
          .number()
          .int({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER })
          .positive({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE })
      ),
    }),

    timeAvailability: z
      .object({
        start: z.string().regex(timeRegex, {
          message: ERROR_CODES.INVALID_TIME_FORMAT,
        }),

        end: z.string().regex(timeRegex, {
          message: ERROR_CODES.INVALID_TIME_FORMAT,
        }),
      })
      .refine(
        (data) => {
          const [startH, startM] = data.start.split(':').map(Number);
          const [endH, endM] = data.end.split(':').map(Number);

          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          return startMinutes < endMinutes;
        },
        {
          message: ERROR_CODES.END_TIME_MUST_BE_GREATER,
          path: ['end'],
        }
      ),
  }),
});

export const adminCreateDriverValidator = (req) => {
  return adminCreateDriverSchema.safeParse({ body: req.body });
};
