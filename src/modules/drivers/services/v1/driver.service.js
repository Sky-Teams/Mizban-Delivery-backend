import { DriverModel } from '../../models/driver.model.js';

// Return Boolean value
export const doesDriverExist = async (userId) => {
  const exist = await DriverModel.exists({ user: userId });
  return !!exist;
};

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
