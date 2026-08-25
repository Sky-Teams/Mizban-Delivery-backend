import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { z } from 'zod';

export const updateLocationSchema = z.object({
  currentLocation: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z
        .number()
        .min(-180, { message: ERROR_CODES.INVALID_COORDINATES })
        .max(180, { message: ERROR_CODES.INVALID_COORDINATES }), // Longitude
      z
        .number()
        .min(-90, { message: ERROR_CODES.INVALID_COORDINATES })
        .max(90, { message: ERROR_CODES.INVALID_COORDINATES }), // Latitude
    ]),
  }),
});
