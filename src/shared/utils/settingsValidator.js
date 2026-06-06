import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { settingKeys } from './enums.js';
import { isNumber } from './math.helper.js';

/**
 * Validate setting key. Each key has its own validation
 * @param {String} key
 * @param {Mixed} value
 */
export const validateSettingValue = (key, value) => {
  switch (key) {
    case settingKeys.COMMISSION_RATE: {
      const commissionRate = Number(value);

      if (!isNumber(commissionRate))
        throw new AppError(
          'Commission rate should be a number',
          400,
          ERROR_CODES.COMMISSION_RATE_MUST_BE_NUMBER
        );

      if (commissionRate < 0 || commissionRate > 100) {
        throw new AppError(
          'Commission rate should be between 0 and 100',
          400,
          ERROR_CODES.INVALID_COMMISSION_RATE_RANGE
        );
      }
      break;
    }
    case settingKeys.DRIVER_MAX_WALLET_GAP: {
      const gapAmount = Number(value);

      if (!isNumber(gapAmount))
        throw new AppError(
          'Driver max wallet gap should be a number',
          400,
          ERROR_CODES.DRIVER_MAX_WALLET_GAP_MUST_BE_NUMBER
        );
      break;
    }
  }
};
