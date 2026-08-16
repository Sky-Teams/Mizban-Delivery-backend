import { z } from 'zod';

const calculateDeliveryPriceSchema = z.object({
  body: z.object({
    pickupLocation: z.object({
      coordinates: z.array(z.number()).length(2),
    }),

    dropoffLocation: z.object({
      coordinates: z.array(z.number()).length(2),
    }),
  }),
});

export const calculateDeliveryPriceValidator = (req) => {
  return calculateDeliveryPriceSchema.safeParse(req);
};
