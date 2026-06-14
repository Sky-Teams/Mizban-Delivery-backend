import z from 'zod';

const updateSettingSchema = z.object({
  body: z.object({
    value: z
      .any()
      .refine((val) => val !== null && val !== undefined, { message: 'Value is required' }),
  }),
  params: z.object({
    key: z.string(),
  }),
});

export const updateSettingValidator = (req) => {
  return updateSettingSchema.safeParse({ body: req.body, params: req.params });
};
