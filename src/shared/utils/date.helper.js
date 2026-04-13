import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

export class DateHelper {
  /**
   * Get the start of the given day in UTC (00:00:00.000)
   * @param {Date | string} value - Input date
   * @returns {Date}
   */
  static getStartDateUTC(value) {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400, ERROR_CODES.INVALID_ISO_DATE_FORMAT);
    }

    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
    );
  }

  /**
   * Get the end of the given day in UTC (23:59:59.999)
   * @param {Date | string} value - Input date
   * @returns {Date}
   */
  static getEndDateUTC(value) {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400, ERROR_CODES.INVALID_ISO_DATE_FORMAT);
    }

    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
    );
  }

  /**
   *Validate full ISO (2026-04-12T14:06:10.899Z) or simple date (2026-04-12)
   * @param {string} val
   * @returns
   */
  static isValidDate = (val) => {
    if (typeof val !== 'string') return false;

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const isoDate = /^\d{4}-\d{2}-\d{2}T.*Z$/;

    return dateOnly.test(val) || isoDate.test(val);
  };
}
