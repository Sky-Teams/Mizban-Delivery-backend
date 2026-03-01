import { businessCustomerModel } from '#modules/users/models/BusinessCustomer.model.js';

export const doesBusinessCustomerExist = async (userId) => {
  const exist = await businessCustomerModel.exists({ business: userId });
  return !!exist; //this operator !!, change everything to boolean
};

export const createBusinessCustomerService = async (bodyData) => {
  const { name, phone, altPhone, addressText, location, notes, tags, lastOrderedAt } = bodyData;

  const newBusinessCustomer = {
    business: req.user._id,
    name,
    phone,
    altPhone,
    addressText,
    location,
    notes,
    tags,
    lastOrderedAt,
  };

  const businessCustomer = await businessCustomerModel.create(newBusinessCustomer);

  return businessCustomer;
};
