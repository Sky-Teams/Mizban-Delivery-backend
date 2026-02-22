import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { DriverModel } from '../../models/driver.model.js';

// Return Boolean value
export const doesDriverExist = async (userId) => {
  const exist = await DriverModel.exists({ user: userId });
  return !!exist;
};

export const createNewDriver = async (userId, driverData) => {
  const exists = await DriverModel.exists({ user: userId });
  if (exists) throw new AppError('Driver already exist', 400, ERROR_CODES.DRIVER_ALREADY_EXIST);

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
