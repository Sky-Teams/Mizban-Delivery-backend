import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';

const vehicleTypes = ['bike', 'car', 'van'];
const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];

const createDriverSchema = z.object({
  body: z.object({
    vehicleType: z.enum(vehicleTypes, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
    }),
    status: z
      .enum(driverStatuses, { errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }) })
      .optional(),
    capacity: z.object({
      maxWeightKg: z.coerce
        .number({ invalid_type_error: ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER })
        .positive({ message: ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE }),

      maxPackages: z.coerce
        .number({ invalid_type_error: ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER })
        .int({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER })
        .positive({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE }),
    }),
  }),
});

export const createDriverValidator = (req) => {
  return createDriverSchema.safeParse({ body: req.body });
};
