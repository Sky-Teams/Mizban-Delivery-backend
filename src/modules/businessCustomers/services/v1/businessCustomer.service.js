import { businessCustomerModel } from '../../models/businessCustomer.model.js';

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

export const getAllBusinessCustomer = async (page = 1, limit = 10, sort) => {
  const skip = (page - 1) * limit;
  let sortOption = sort === 'top' ? { totalOrders: -1 } : { createdAt: -1 }; //sort base totalorders or newest

  const totalBusinessCustomers = await businessCustomerModel.countDocuments({ isActive: true });
  const businessCustomers = await businessCustomerModel
    .find()
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    businessCustomers,
    totalBusinessCustomers,
    totalPage: Math.ceil(totalBusinessCustomers / limit),
  };
};
