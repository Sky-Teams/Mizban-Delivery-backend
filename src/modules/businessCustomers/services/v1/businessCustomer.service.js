import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';

export const doesBusinessCustomerExist = async (businessId, phone, email) => {
  const exist = await businessCustomerModel.exists({
    business: businessId,
    $or: [{ phone }, { email }],
  });
  return !!exist;
};

export const createNewBusinessCustomer = async (bodyData) => {
  const { businessId, name, phone, altPhone, email, addressText, location, notes, tags } = bodyData;

  const businessCustomer = await businessCustomerModel.create({
    business: businessId,
    name,
    phone,
    altPhone,
    email,
    addressText,
    location,
    notes,
    tags,
  });

  return businessCustomer;
};
