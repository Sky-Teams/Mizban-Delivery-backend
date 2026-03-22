import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { BusinessModel } from '../../models/business.model.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { filterUserField } from '#shared/utils/queryBuilder.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

//region admin
//create new business by admin
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

//update business by admin
export const modifyExistedBusiness = withTransaction(async (session, businessId, businessData) => {
  const { username, email, userPhoneNumber } = businessData;

  const userData = {
    ...(username && { name: username }),
    ...(email && { email }),
    ...(userPhoneNumber && { phone: userPhoneNumber }),
  };
  const userUpdateFields = await filterUserField(userData);

  const allowedFieldsToUpdate = [
    'name',
    'type',
    'addressText',
    'phone',
    'prepTimeAvgMinutes',
    'location',
  ];

  const businessUpdateFields = {};

  for (const key of Object.keys(businessData)) {
    if (allowedFieldsToUpdate.includes(key) && key !== 'location') {
      businessUpdateFields[key] = businessData[key];
    }
  }

  if (businessData.location?.coordinates !== undefined) {
    businessUpdateFields['location.coordinates'] = businessData.location.coordinates;
  }

  if (
    Object.keys(userUpdateFields).length === 0 &&
    Object.keys(businessUpdateFields).length === 0
  ) {
    throw new AppError('No fields provided for update', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
  }

  const updateUser = Object.keys(userUpdateFields).length
    ? await UserModel.findOneAndUpdate(
        { _id: businessData.userId },
        { $set: userUpdateFields },
        { runValidators: true, session, returnDocument: 'after' }
      )
    : null;

  const updateBusiness = Object.keys(businessUpdateFields).length
    ? await BusinessModel.findByIdAndUpdate(
        businessId,
        { $set: businessUpdateFields },
        { runValidators: true, session, returnDocument: 'after' }
      )
    : null;

  if (Object.keys(userUpdateFields).length && !updateUser) throw notFound('User');
  if (Object.keys(businessUpdateFields).length && !updateBusiness) throw notFound('Business');

  return {
    ...(updateBusiness ? updateBusiness.toObject() : {}),
    ...(updateUser
      ? { username: updateUser.name, email: updateUser.email, userPhoneNumber: updateUser.phone }
      : {}),
    owner: updateBusiness?.owner,
  };
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
    updates['location.coordinates'] = businessData.location.coordinates;
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
