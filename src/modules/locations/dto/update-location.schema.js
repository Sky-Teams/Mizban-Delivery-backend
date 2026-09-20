import { createGeoPointSchema } from '#shared/utils/dto.helper.js';
import { z } from 'zod';

export const updateLocationSchema = z.object({
  currentLocation: createGeoPointSchema(),
});
