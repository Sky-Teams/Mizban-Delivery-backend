import { BusinessModel } from '../../models/business.model.js';

export const DoesBusinessesExist = async (ownerId, phone) => {
  const exist = await BusinessModel.exists({ owner: ownerId, phone });

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
