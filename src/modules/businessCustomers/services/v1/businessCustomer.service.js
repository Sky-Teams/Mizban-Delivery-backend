import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';

export const doesBusinessCustomerExist = async (businessId, phone) => {
  const exist = await businessCustomerModel.exists({ business: businessId, phone });
  return !!exist;
};

export const createNewBusinessCustomer = async (req) => {
  const { name, phone, altPhone, addressText, location, notes, tags, lastOrderAt } = req.body;

  const newBusinessCustomer = {
    business: req.user._id,
    name,
    phone,
    altPhone,
    addressText,
    location,
    notes,
    tags,
    lastOrderAt,
  };

  const businessCustomer = await businessCustomerModel.create(newBusinessCustomer);

  return businessCustomer;
};
