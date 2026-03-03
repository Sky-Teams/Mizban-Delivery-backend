import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';

export const doesBusinessCustomerExist = async (businessId, phone) => {
  const exist = await businessCustomerModel.exists({ business: businessId, phone });
  return !!exist;
};

export const createNewBusinessCustomer = async (req) => {
  const { name, phone, altPhone, addressText, location, notes, tags } = req.body;

  const businessCustomer = await businessCustomerModel.create({
    business: req.user.businessId,
    name,
    phone,
    altPhone,
    addressText,
    location,
    notes,
    tags,
  });

  return businessCustomer;
};
