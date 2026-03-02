import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

//* Use this function for all fields that need date validation

/**
 * Validate that a value is a valid ISO 8601 date string.
 * Throws AppError with a customerCode if invalid.
 */
export const ensureISODate = (
  val,
  errorCode = ERROR_CODES.INVALID_ISO_DATE_FORMAT,
  field = 'DATE'
) => {
  if (typeof val !== 'string') {
    throw new AppError('Validation failed', 400, errorCode, field);
  }

  // ISO format
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!isoRegex.test(val)) {
    throw new AppError('Validation failed', 400, errorCode, field);
  }

  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new AppError('Validation failed', 400, errorCode, field);
  }

  return date;
};
