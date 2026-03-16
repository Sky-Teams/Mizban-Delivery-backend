import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

/** Calculate total price of each item and return as an array of objects */
export const calculateItemsTotal = (items) => {
  const result = items.map((item) => {
    if (item.quantity <= 0) {
      throw new AppError('Item quantity must be positive', 400, ERROR_CODES.INVALID_ITEM_QUANTITY);
    }
    if (item.unitPrice < 0) {
      throw new AppError(
        'Item unitPrice must be non-negative',
        400,
        ERROR_CODES.INVALID_ITEM_UNIT_PRICE
      );
    }
    return {
      ...item,
      total: Number(item.quantity || 1) * Number(item.unitPrice || 0),
    };
  });
  return result;
};
