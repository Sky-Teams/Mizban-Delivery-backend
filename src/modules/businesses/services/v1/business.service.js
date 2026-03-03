import { noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { BusinessModel } from '../../models/business.model.js';

//Check ownership
export const isOwner = async (userId, id) => {
  const business = await BusinessModel.findById(id);
  if (!business) throw notFound('Business');

  return String(userId) === String(business.owner);
};

//Partial Update (Business)
export const updateBusinessService = async (userId, businessId, businessData) => {
  const allowedFieldsToUpdate = [
    'name',
    'type',
    'addressText',
    'phone',
    'prepTimeAvgMinutes',
    'location',
  ];

  const updates = {};
  for (const key of Object.keys(businessData)) {
    if (allowedFieldsToUpdate.includes(key) && key !== 'location') {
      updates[key] = businessData[key];
    }
  }

  if (businessData.location?.coordinates !== undefined) {
    ((updates['location.type'] = 'Point'),
      (updates['location.coordinates'] = businessData.location.coordinates));
  }
  if (Object.keys(updates).length === 0) throw noFieldsProvidedForUpdate();

  const updateBusiness = await BusinessModel.findOneAndUpdate(
    { _id: businessId, owner: userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updateBusiness) throw notFound('Business');

  return updateBusiness;
};
