import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { DriverModel } from '#modules/drivers/models/driver.model.js';
import { updateLocationSchema } from '#modules/locations/dto/update-location.schema.js';
import { notFound } from '#shared/errors/error.js';

export const updateDriverLocation = async (userId, data) => {
  let driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  const [lat, long] = data.currentLocation.coordinates;
  /** Validation location data (type, latitude, longitude) */
  updateLocationSchema.parse({
    currentLocation: {
      type: data.currentLocation.type,
      coordinates: [long, lat],
    },
  });

  /** Update driver location to DB */
  driver = await DriverModel.findOneAndUpdate(
    { _id: driver.id, user: userId },
    {
      $set: {
        currentLocation: {
          type: data.currentLocation.type,
          coordinates: [long, lat],
        },
        lastLocationAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  );

  return driver;
};
