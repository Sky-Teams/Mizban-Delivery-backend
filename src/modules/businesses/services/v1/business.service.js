import { noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { BusinessModel } from '../../models/business.model.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';

//region admin
export const addNewBusiness = withTransaction(async (session, businessData) => {
  const {
    username,
    email,
    userPhoneNumber,
    name,
    type,
    addressText,
    phone,
    location,
    prepTimeAvgMinutes,
  } = businessData;

  //user info
  const userPassword = 'business123';
  const hashPassw = await hashPassword(userPassword);
  const userData = {
    name: username,
    email,
    phone: userPhoneNumber,
    password: hashPassw,
    role: 'business',
  };
  const [user] = await UserModel.create([userData], { session });

  const newBusiness = {
    owner: user._id,
    name,
    type,
    addressText,
    phone,
    location,
    prepTimeAvgMinutes,
  };
  const [business] = await BusinessModel.create([newBusiness], { session });

  return business;
});

//endregion

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
