import { BusinessModel } from '../../models/business.model.js';

//Create new Business
export const createNewBusiness = async (userId, businessData) => {
  const {
    name,
    type: businessType,
    phone,
    addressText,
    prepTimeAvgMinutes,
    location,
  } = businessData;

  const newBusiness = await BusinessModel.create({
    name,
    type: businessType,
    phone,
    addressText,
    prepTimeAvgMinutes,
    location,
    owner: userId,
  });

  return newBusiness;
};

export const getAllBusinesses = async (limit = 8, page = 1, searchQuery = {}) => {
  const skip = (page - 1) * limit;

  const query = {};

  if (searchQuery.searchTerm) {
    query.name = { $regex: searchQuery.searchTerm, $options: 'i' };
  }

  const businesses = await BusinessModel.find(query)
    .skip(skip)
    .limit(limit)
    .populate('owner', 'name email')
    .lean();

  const totalBusinesses = await BusinessModel.countDocuments(query);

  return { businesses, totalBusinesses, totalPages: Math.ceil(totalBusinesses / limit) };
};

export const getBusinessById = async (businessId) => {
  const business = await BusinessModel.findById(businessId).populate('owner', 'name email');

  return business;
};
