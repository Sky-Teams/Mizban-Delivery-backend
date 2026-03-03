import {
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
} from '#modules/businessCustomers/services/v1/businessCustomer.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, unauthorized } from '#shared/errors/error.js';

export const createBusinessCustomer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await doesBusinessCustomerExist(req.user._id, req.body.phone);
  if (exist) {
    throw new AppError(
      'Business customer already exists',
      400,
      ERROR_CODES.BUSINESS_CUSTOMER_ALREADY_EXIST
    );
  }

  const businessCustomer = await createNewBusinessCustomer(req);

  res.status(201).json({
    success: true,
    data: businessCustomer,
  });
};
