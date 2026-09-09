import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { createGeoPointSchema } from '#shared/utils/dto.helper.js';
import { z } from 'zod';

const calculateDeliveryPriceSchema = z.object({
  body: z.object({
    pickupLocation: createGeoPointSchema(ERROR_CODES.INVALID_PICKUP_COORDINATES),

    dropoffLocation: createGeoPointSchema(ERROR_CODES.INVALID_DROPOFF_COORDINATES),
  }),
});

export const calculateDeliveryPriceValidator = (req) => {
  return calculateDeliveryPriceSchema.safeParse(req);
};
