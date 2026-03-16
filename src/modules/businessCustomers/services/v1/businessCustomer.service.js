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

export const getAllBusinessCustomer = async (page = 1, limit = 10, searchQuery = {}) => {
  const { sort, searchTerm, ...filters } = searchQuery;
  const skip = (page - 1) * limit;
  let sortOption = sort === 'top' ? { totalOrders: -1 } : { createdAt: -1 }; //sort base totalorders or latest

  let query = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined)
  );

  if (searchTerm) {
    query['$or'] = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const totalBusinessCustomers = await businessCustomerModel.countDocuments(query);
  const businessCustomers = await businessCustomerModel
    .find(query)
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
