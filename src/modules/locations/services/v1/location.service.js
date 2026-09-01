import { DriverModel } from '#modules/drivers/models/driver.model.js';

export const updateDriverLocation = async (driverId, data) => {
  const [lat, lng] = data.currentLocation.coordinates;

  /** Update driver location to DB */
  let driver = await DriverModel.findOneAndUpdate(
    { _id: driverId },
    {
      $set: {
        currentLocation: {
          type: data.currentLocation.type,
          coordinates: [lng, lat],
        },
        lastLocationAt: new Date(),
      },
    },
    { returnDocument: 'after', runValidators: true }
  );

  return driver;
};
