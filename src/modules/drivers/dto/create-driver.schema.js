import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { z } from 'zod';
const vehicleTypes = ['bike', 'car', 'van'];
const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];

// For now we dont need this schema validation for user.In future we will need this.
const createDriverSchema = z.object({
  body: z.object({
    vehicleType: z.enum(vehicleTypes, {
      errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
    }),
    status: z
      .enum(driverStatuses, { errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }) })
      .optional(),
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
  }),
});

export const createDriverValidator = (req) => {
  return createDriverSchema.safeParse({ body: req.body });
};
