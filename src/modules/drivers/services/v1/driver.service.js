import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import {
  driverQueryBuilder,
  filterDriverField,
  filterUserField,
} from '#shared/utils/queryBuilder.js';
import { DriverModel } from '../../models/driver.model.js';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';

//#region Admin Services

/** Fetch all Drivers with pagination functionality */
export const fetchDrivers = async (limit = 8, page = 1, searchQuery = {}) => {
  const skip = (page - 1) * limit;

  const query = driverQueryBuilder(searchQuery);

  const totalDrivers = await DriverModel.countDocuments(query);

  const drivers = await DriverModel.find(query)
    .populate('user', 'name phone email isActive')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return { drivers, totalDrivers, totalPages: Math.ceil(totalDrivers / limit) };
};

/** Fetch a driver by driverId */
export const fetchDriverByDriverId = async (driverId) => {
  const drivers = await DriverModel.find({ _id: driverId })
    .populate({
      path: 'user',
      select: 'name phone email isActive',
    })
    .lean();
  return drivers;
};

/** Create a new driver in system through admin*/
const addDriver = async (session, driverData) => {
  const {
    name,
    email,
    phone,
    vehicleType,
    status,
    capacity,
    address,
    vehicleRegistrationNumber,
    timeAvailability,
  } = driverData;

  const { maxWeightKg, maxPackages } = capacity;
  const { start, end } = timeAvailability;

  // Temporary default password for drivers created by admin
  const userPassword = 'driver@123456789';
  const hashedPassword = await hashPassword(userPassword);

  // Create user
  const newUser = await UserModel.create(
    [{ name, email, phone, role: 'driver', password: hashedPassword }],
    { session }
  );

  // Create driver linked to user
  const newDriver = {
    user: newUser[0]._id,
    vehicleType,
    status,
    capacity: { maxWeightKg, maxPackages },
    address,
    vehicleRegistrationNumber,
    timeAvailability: { start, end },
    isVerified: true,
  };

  const driver = await DriverModel.create([newDriver], { session });
  const driverPlainObject = driver[0].toObject();

  return {
    _id: driverPlainObject._id,
    userId: driverPlainObject.user,
    name,
    email,
    phone,
    vehicleType: driverPlainObject.vehicleType,
    status: driverPlainObject.status,
    capacity: driverPlainObject.capacity,
    currentLocation: driverPlainObject.currentLocation,
    address: driverPlainObject.address,
    vehicleRegistrationNumber: driverPlainObject.vehicleRegistrationNumber,
    timeAvailability: driverPlainObject.timeAvailability,
    isVerified: driverPlainObject.isVerified,
    createdAt: driverPlainObject.createdAt,
    updatedAt: driverPlainObject.updatedAt,
  };
};

const modifyDriver = async (session, driverId, driverData) => {
  const driverUpdateQuery = filterDriverField(driverData);
  const userUpdateQuery = await filterUserField(driverData);

  if (!Object.keys(driverUpdateQuery).length && !Object.keys(userUpdateQuery).length) {
    throw new AppError('No fields provided for update', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
  }

  const updatedDriver = Object.keys(driverUpdateQuery).length
    ? await DriverModel.findByIdAndUpdate(
        driverId,
        { $set: driverUpdateQuery },
        { runValidators: true, session, returnDocument: 'after' }
      )
    : null;

  const updatedUser = Object.keys(userUpdateQuery).length
    ? await UserModel.findOneAndUpdate(
        { _id: driverData.userId },
        { $set: userUpdateQuery },
        { runValidators: true, session, returnDocument: 'after' }
      )
    : null;

  if (Object.keys(driverUpdateQuery).length && !updatedDriver) throw notFound('Driver');
  if (Object.keys(userUpdateQuery).length && !updatedUser) throw notFound('User');

  return {
    ...(updatedDriver ? updatedDriver.toObject() : {}),
    ...(updatedUser
      ? {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
        }
      : {}),
    userId: driverData.userId,
  };
};

export const modifyExistedDriver = withTransaction(modifyDriver);
export const addNewDriver = withTransaction(addDriver);

//#endregion

//#region User Services => For now we dont need these services, in future we can use them

/** Check if the driver exist by userId. Return true or false. */
export const doesDriverExist = async (userId) => {
  const exist = await DriverModel.exists({ user: userId });
  return !!exist;
};

/** create driver account for a user */
export const createNewDriver = async (userId, driverData) => {
  const { vehicleType, status, capacity, address, vehicleRegistrationNumber, timeAvailability } =
    driverData;

  const { start, end } = timeAvailability;

  const { maxWeightKg, maxPackages } = capacity;

  const newDriver = {
    user: userId,
    vehicleType,
    status,
    capacity: {
      maxWeightKg,
      maxPackages,
    },
    address,
    vehicleRegistrationNumber,
    timeAvailability: { start, end },
  };

  const driver = await DriverModel.create(newDriver);

  return driver;
};

/** Update driver info.(Partial Update)  */
export const updateExistedDriver = async (driverId, userId, driverData) => {
  const allowedFieldsToUpdate = {
    vehicleType: true,
    status: true,
    capacity: true,
    currentLocation: true,
    lastLocationAt: true,
  };

  const updateQuery = {};

  for (const key of Object.keys(driverData)) {
    if (allowedFieldsToUpdate[key] && key !== 'capacity' && key !== 'currentLocation') {
      updateQuery[key] = driverData[key];
    }
  }

  // Handle nested object for capacity
  if (driverData.capacity) {
    if (driverData.capacity.maxWeightKg !== undefined) {
      updateQuery['capacity.maxWeightKg'] = driverData.capacity.maxWeightKg;
    }

    if (driverData.capacity.maxPackages !== undefined) {
      updateQuery['capacity.maxPackages'] = driverData.capacity.maxPackages;
    }
  }

  // Handle currentLocation coordinates
  if (driverData.currentLocation?.coordinates !== undefined) {
    updateQuery['currentLocation.coordinates'] = driverData.currentLocation.coordinates;
  }

  if (Object.keys(updateQuery).length === 0) {
    throw noFieldsProvidedForUpdate();
  }

  const updatedDriver = await DriverModel.findOneAndUpdate(
    { _id: driverId, user: userId },
    { $set: updateQuery },
    { new: true, runValidators: true }
  );

  if (!updatedDriver) throw notFound('Driver');

  return updatedDriver;
};

export const getDriverInfoByUserId = async (userId) => {
  const driverInfo = await DriverModel.find({ user: userId });
  return driverInfo;
};

//#endregion
