import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import mongoose from 'mongoose';
import { z } from 'zod';

const vehicleTypes = ['bike', 'car', 'van'];
const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const adminUpdateDriverSchema = z.object({
  body: z
    .object({
      userId: z.string().refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
        message: ERROR_CODES.INVALID_USER_ID,
      }),
      name: z.string().trim().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }).optional(),
      email: z
        .string()
        .email({ message: ERROR_CODES.INVALID_EMAIL })
        .trim()
        .toLowerCase()
        .optional(),

      phone: z
        .string()
        .refine((val) => !val || isValidPhoneNumber(val, 'AF'), {
          message: ERROR_CODES.INVALID_PHONE_NUMBER,
        })
        .optional(),

      vehicleType: z
        .enum(vehicleTypes, {
          errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
        })
        .optional(),

      status: z
        .enum(driverStatuses, {
          errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }),
        })
        .optional(),

      vehicleRegistrationNumber: z
        .string()
        .min(1, { message: ERROR_CODES.VEHICLE_REGISTRATION_REQUIRED })
        .optional(),

      address: z.string().optional().nullable(),

      capacity: z
        .object({
          maxWeightKg: z
            .preprocess(
              (val) =>
                val !== undefined &&
                ensureNumber(val, 'capacity.maxWeightKg', ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER),
              z.number().positive({ message: ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE })
            )
            .optional(),

          maxPackages: z
            .preprocess(
              (val) =>
                val !== undefined &&
                ensureNumber(val, 'capacity.maxPackages', ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER),
              z
                .number()
                .int({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER })
                .positive({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE })
            )
            .optional(),
        })
        .partial()
        .optional(),

      timeAvailability: z
        .object({
          start: z
            .string()
            .regex(timeRegex, { message: ERROR_CODES.INVALID_TIME_FORMAT })
            .optional(),
          end: z.string().regex(timeRegex, { message: ERROR_CODES.INVALID_TIME_FORMAT }).optional(),
        })
        .refine(
          (data) => {
            if (!data.start || !data.end) return true;
            const [startH, startM] = data.start.split(':').map(Number);
            const [endH, endM] = data.end.split(':').map(Number);
            return startH * 60 + startM < endH * 60 + endM;
          },
          { message: ERROR_CODES.END_TIME_MUST_BE_GREATER, path: ['end'] }
        )
        .optional(),
    })
    .partial(), // make all fields optional for update
});

export const adminUpdateDriverValidator = (req) => {
  return adminUpdateDriverSchema.safeParse({ body: req.body });
};
