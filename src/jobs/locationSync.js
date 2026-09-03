import { updateDriverLocation } from '#modules/locations/index.js';
import { REDIS_KEYS } from '#shared/utils/enums.js';
import { RedisService } from '#shared/utils/redisLocationService.js';

const LOCATION_TRACKING_INTERVAL = Number(process.env.LOCATION_TRACKING_INTERVAL) || 20;

const locationSyncIntervals = new Map();

/** Start Saving Location to DB */
export const startLocationSync = (driverId) => {
  const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;

  if (locationSyncIntervals.has(driverLocationKey)) return;

  console.log(`Start location sync for driver:${driverId}`);

  const interval = setInterval(async () => {
    try {
      const location = await RedisService.getRedisData(driverLocationKey);
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

  locationSyncIntervals.set(driverLocationKey, interval);
};

/** Stop Saving Location to DB */
export const stopLocationSync = (driverId) => {
  const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;

  const interval = locationSyncIntervals.get(driverLocationKey);

  if (!interval) return;

  clearInterval(interval);

  locationSyncIntervals.delete(driverLocationKey);

  console.log(`Stopped location sync for driver: ${driverId}`);
};
