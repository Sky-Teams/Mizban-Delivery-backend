import { AppError, noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { driverQueryBuilder } from '#shared/utils/queryBuilder.js';
import mongoose from 'mongoose';
import { DriverModel } from '../../models/driver.model.js';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

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
export const addNewDriver = async (driverData) => {
  const { name, email, phone, vehicleType, status, capacity } = driverData;
  const { maxWeightKg, maxPackages } = capacity;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Temporary default password for drivers created by admin. For now, we use this fixed password, but in the future:
    // 1. Generate a random unique password per driver
    // 2. Send it securely (email) to the driver and require the driver to reset it on first login
    const userPassword = 'driver@123456789';
    const hashedPassword = await hashPassword(userPassword);

    const newUser = await UserModel.create(
      [{ name, email, phone, role: 'driver', password: hashedPassword }],
      { session }
    );

    const newDriver = {
      user: newUser[0]._id,
      vehicleType,
      status,
      capacity: {
        maxWeightKg,
        maxPackages,
      },
    };

    const driver = await DriverModel.create([newDriver], { session });

    await session.commitTransaction();
    session.endSession();

    const newDriverData = {
      name,
      phone,
      email,
      ...driver[0],
    };

    return newDriverData;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(error.message, 400, ERROR_CODES.TRANSACTION_FAILED);
  }
};

export const modifiyDriver = async (driverData) => {};

//#endregion

//#region User Services => For now we dont need these services, in future we can use them

/** Check if the driver exist by userId. Return true or false. */
export const doesDriverExist = async (userId) => {
  const exist = await DriverModel.exists({ user: userId });
  return !!exist;
};

/** create driver account for a user */
export const createNewDriver = async (userId, driverData) => {
  const { vehicleType, status, capacity } = driverData;
  const { maxWeightKg, maxPackages } = capacity;

  const newDriver = {
    user: userId,
    vehicleType,
    status,
    capacity: {
      maxWeightKg,
      maxPackages,
    },
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
