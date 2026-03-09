import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';
import {
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
  updateExistedBusinessCustomer,
} from '#modules/businessCustomers/services/v1/businessCustomer.service.js';
import { BusinessModel } from '#modules/businesses/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound, unauthorized } from '#shared/errors/error.js';

export const createBusinessCustomer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await doesBusinessCustomerExist(
    req.body.businessId,
    req.body.phone,
    req.body.email
  );
  if (exist) {
    throw new AppError(
      'Business customer already exists',
      400,
      ERROR_CODES.BUSINESS_CUSTOMER_ALREADY_EXIST
    );
  }

  const businessCustomer = await createNewBusinessCustomer(req.body);

  res.status(201).json({
    success: true,
    data: businessCustomer,
  });
};

export const updateBusinessCustomer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const customer = await businessCustomerModel.findById(req.params.id);
  if (!customer) throw notFound('Customer');

  const business = await BusinessModel.findById(customer.business);
  if (!business) throw notFound('Business');

  if (!business.owner.equals(req.user._id)) throw unauthorized();

  const updatedBusinessCustomer = await updateExistedBusinessCustomer(
    req.params.id,
    business._id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: updatedBusinessCustomer,
  });
};
