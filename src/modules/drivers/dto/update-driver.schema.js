import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ensureISODate } from '#shared/utils/ensureISODate.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { z } from 'zod';

const vehicleTypes = ['bike', 'car', 'van'];
const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];

const updateDriverSchema = z.object({
  body: z
    .object({
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

      currentLocation: z
        .object({
          type: z.literal('Point').optional(),
          coordinates: z
            .preprocess(
              (val) => {
                if (!Array.isArray(val) || val.length !== 2) return val;
                return val.map((v, i) =>
                  ensureNumber(
                    v,
                    `currentLocation.coordinates[${i}]`,
                    ERROR_CODES.INVALID_COORDINATES
                  )
                );
              },
              z.array(z.number()).length(2, { message: ERROR_CODES.INVALID_COORDINATES })
            )
            .optional(),
        })
        .partial()
        .optional(),

      lastLocationAt: z.preprocess(
        (val) =>
          val
            ? ensureISODate(val, ERROR_CODES.INVALID_ISO_DATE_FORMAT, 'lastLocationAt')
            : undefined,
        z.date().optional()
      ),
    })
    .partial(),
});

export const updateDriverValidator = (req) => {
  return updateDriverSchema.safeParse({ body: req.body });
};
