import { AppError } from '#shared/errors/error.js';

/**
 * Ensure a value is a number.
 * Zod cannot return our custom codes, so we manually throw AppError
 * with the proper field and code if validation fails.
 */
export const ensureNumber = (val, field, code) => {
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) {
    throw new AppError('Validation failed', 400, code, field);
  }
  return num;
};
