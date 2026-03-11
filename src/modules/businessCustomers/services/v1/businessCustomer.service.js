import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';
import { BusinessModel } from '#modules/businesses/index.js';
import { noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';

export const doesBusinessCustomerExist = async (businessId, phone, email) => {
  const exist = await businessCustomerModel.exists({
    business: businessId,
    $or: [{ phone }, { email }],
  });
  return !!exist;
};

export const findBusinessCustomerById = async (customerId) => {
  return await businessCustomerModel.findById(customerId);
};

const DoesBusinessExist = async (id) => {
  const exists = await BusinessModel.exists({ _id: id });
  return !!exists;
};

export const createNewBusinessCustomer = async (bodyData) => {
  const { businessId, name, phone, altPhone, email, addressText, location, notes, tags } = bodyData;

  const exist = await DoesBusinessExist(businessId);

  if (!exist) throw notFound('Business');

  const businessCustomer = await businessCustomerModel.create({
    business: businessId,
    name,
    phone,
    altPhone,
    addressText,
    location,
    notes,
    tags,
    email,
  });

  return businessCustomer;
};

export const updateExistedBusinessCustomer = async (
  businessCustomerId,
  businessId,
  businessCustomerData
) => {
  const allowedFields = {
    name: true,
    phone: true,
    email: true,
    altPhone: true,
    addressText: true,
    location: true,
    notes: true,
    tags: true,
    isActive: true,
  };

  const updateQuery = {};

  for (const key of Object.keys(businessCustomerData)) {
    if (allowedFields[key]) updateQuery[key] = businessCustomerData[key];
  }
  if (Object.keys(updateQuery).length === 0) throw noFieldsProvidedForUpdate();

  const updatedBusinessCustomer = await businessCustomerModel.findOneAndUpdate(
    { _id: businessCustomerId, business: businessId },
    { $set: updateQuery },
    { new: true, runValidators: true }
  );

  if (!updatedBusinessCustomer) throw notFound('BusinessCustomer');

  return updatedBusinessCustomer;
};
