import { z } from 'zod';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

/** Create a GeoPoint Zod schema with custom error code */
export const createGeoPointSchema = (customErrorCode = ERROR_CODES.INVALID_COORDINATES) => {
  return z.object({
    type: z.literal('Point').optional(),
    coordinates: z.preprocess(
      (val) => {
        if (!Array.isArray(val) || val.length !== 2) return val;
        return val.map((v, i) => ensureNumber(v, `coordinates[${i}]`, customErrorCode));
      },
      z.array(z.number()).length(2, { message: customErrorCode })
    ),
  });
};
