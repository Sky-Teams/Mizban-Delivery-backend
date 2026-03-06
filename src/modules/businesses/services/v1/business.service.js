import { BusinessModel } from '../../models/business.model.js';

export const DoesBusinessesExist = async (ownerId, phone, addressText) => {
  const exist = await BusinessModel.exists({ owner: ownerId, phone, addressText });

  return !!exist;
};

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

export const getAllBusinesses = async () => {
  const allBusinesses = await BusinessModel.find().populate('owner', 'name email').lean();

  return allBusinesses;
};

export const getBusinessById = async (businessId) => {
  const business = await BusinessModel.findById(businessId).populate('owner', 'name email');

  return business;
};
