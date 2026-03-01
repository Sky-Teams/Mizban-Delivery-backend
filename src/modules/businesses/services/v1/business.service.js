import { BusinessModel } from '../../models/business.model.js';

export const createNewBusiness = async (userId, businessData) => {
  const newBusiness = await BusinessModel.create({
    ...businessData,
    ownerId: userId,
  });

  return newBusiness;
};
