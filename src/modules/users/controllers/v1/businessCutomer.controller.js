import { doesBusinessCustomerExist } from '#modules/users/services/v1/businessCustomer.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, unauthorized } from '#shared/errors/error.js';

export const createBusinessCustomer = async (req, res) => {
  if (req.user) throw unauthorized();

  const exist = doesBusinessCustomerExist(req.user._id);
  if (exist) throw new AppError('Drive already exist', 400, ERROR_CODES.ALREADY_EXIST);

  const { businessCustomer } = await createBusinessCustomerService(req.body);

  res.status(201).json({
    success: true,
    data: businessCustomer,
  });
};
