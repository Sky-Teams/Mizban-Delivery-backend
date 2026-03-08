import { noFieldsProvidedForUpdate, notFound } from '#shared/errors/error.js';
import { DriverModel } from '../../models/driver.model.js';

/** Check if the driver exist by driverId. Return true or false */
export const doesDriverExistByDriverId = async (driverId) => {
  const exist = await DriverModel.exists({ _id: driverId });
  return !!exist;
};

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
