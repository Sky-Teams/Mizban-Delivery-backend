import {
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
  getAllBusinessCustomer,
  findBusinessCustomerById,
  updateExistedBusinessCustomer,
} from '#modules/businessCustomers/services/v1/businessCustomer.service.js';
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

export const getBusinessCustomers = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { page, limit } = req.query;
  const searchQuery = {
    searchTerm: req.query.searchTerm,
    sort: req.query.sort,
    business: req.query.businessId,
    isActive: req.query.isActive,
  };

  const { businessCustomers, totalBusinessCustomers, totalPage } = await getAllBusinessCustomer(
    page,
    limit,
    searchQuery
  );

  res.status(200).json({
    success: true,
    data: businessCustomers,
    totalBusinessCustomers,
    totalPage,
  });
};

export const updateBusinessCustomer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const customer = await findBusinessCustomerById(req.params.id);
  if (!customer) throw notFound('Customer');

  const updatedBusinessCustomer = await updateExistedBusinessCustomer(
    req.params.id,
    customer.business,
    req.body
  );

  res.status(200).json({
    success: true,
    data: updatedBusinessCustomer,
  });
};
