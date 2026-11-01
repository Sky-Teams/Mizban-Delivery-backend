import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { DateHelper } from '#shared/utils/date.helper.js';
import z from 'zod';

const driverDistanceSchema = z.object({
  date: z.preprocess((val) => {
    if (!val) return undefined;
    if (!DateHelper.isValidDate(val))
      throw new AppError('Invalid date format', 400, ERROR_CODES.INVALID_DATE_FORMAT);
    return val;
  }, z.coerce.date().optional()),

  startDate: z.preprocess((val) => {
    if (!val) return undefined;
    if (!DateHelper.isValidDate(val))
      throw new AppError('Invalid date format', 400, ERROR_CODES.INVALID_PARAMETER_START_DATE);
    return val;
  }, z.coerce.date().optional()),

  endDate: z.preprocess((val) => {
    if (!val) return undefined;
    if (!DateHelper.isValidDate(val))
      throw new AppError('Invalid date format', 400, ERROR_CODES.INVALID_PARAMETER_END_DATE);
    return val;
  }, z.coerce.date().optional()),
});

export const driverDistanceValidator = (req) => {
  return driverDistanceSchema.safeParse({ query: req.query });
};
