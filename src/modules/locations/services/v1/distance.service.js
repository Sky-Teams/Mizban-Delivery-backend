import { DriverModel } from '#modules/drivers/index.js';
import { calculateDistanceMeters } from '#shared/utils/distance.helper.js';

export const updateDriverDistance = async (driverId, prevLocation, currentLocation) => {
  const distance = calculateDistanceMeters(prevLocation, currentLocation);
  await DriverModel.findByIdAndUpdate(
    driverId,
    {
      $inc: {
        distance,
      },
    },
    {
      runValidators: true,
    }
  );
};
