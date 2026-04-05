import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

export const getStartAndEndOfWeekDate = (Date) => {
  const date = dayjs(Date);

  if (!date.isValid()) {
    throw new AppError('invalid date format', 400, ERROR_CODES.INVALID_DATE_FORMAT);
  }
  const startOfWeek = date ? dayjs(date).startOf('isoWeek') : dayjs().startOf('isoWeek');
  const endOfWeek = date ? dayjs(date).endOf('isoWeek') : dayjs().endOf('isoWeek');

  return [startOfWeek.toDate(), endOfWeek.toDate()];
};
