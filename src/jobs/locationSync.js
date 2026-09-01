import { updateDriverLocation } from '#modules/locations/index.js';
import { getDriverLocationFromRedis } from '#shared/utils/redisLocationService.js';

const LOCATION_TRACKING_INTERVAL = Number(process.env.LOCATION_TRACKING_INTERVAL) || 20;

let locationSyncIntervals = new Map();

/** Start Saving Location to DB */
export const startLocationSync = (driverId) => {
  const key = String(driverId);

  if (locationSyncIntervals.has(key)) return;

  console.log(`Start location sync for driver:${driverId}`);

  const interval = setInterval(async () => {
    try {
      const location = await getDriverLocationFromRedis(driverId);

      const data = {
        currentLocation: {
          type: 'Point',
          coordinates: [Number(location.lat), Number(location.lng)],
        },
      };

      await updateDriverLocation(driverId, data);

      console.log(`Driver ${driverId} location synced to database`);
    } catch (error) {
      console.error(`Error to location sync`, error);
    }
  }, LOCATION_TRACKING_INTERVAL * 1000);

  locationSyncIntervals.set(key, interval);
};

/** Stop Saving Location to DB */
export const stopLocationSync = (driverId) => {
  const key = String(driverId);

  const interval = locationSyncIntervals.get(key);

  if (!interval) return;

  clearInterval(interval);

  locationSyncIntervals.delete(key);

  console.log(`Stopped location sync for driver: ${driverId}`);
};
