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

  const locationData = location?.coordinates
    ? { type: 'Point', coordinates: location.coordinates }
    : undefined;

  const newBusiness = await BusinessModel.create({
    name,
    type: businessType,
    phone,
    addressText,
    prepTimeAvgMinutes,
    ...(locationData ? { location: locationData } : {}),
    owner: userId,
  });

  return newBusiness;
};
