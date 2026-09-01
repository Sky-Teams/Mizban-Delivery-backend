import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { updateLocationSchema } from '#modules/locations/dto/update-location.schema.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { DtoService } from './dtoService.js';
import { SOCKET_EVENTS } from './enums.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService.js';
import {
  deleteDriverLocationFromRedis,
  getDriverLocationFromRedis,
  saveLocationInRedis,
} from './redisLocationService.js';

export class LocationService {
  /**
   * Update driver's current location.
   * @param {string} userId
   * @param {object} data
   */
  static async updateLocation(userId, data) {
    try {
      let driver = await fetchDriverByUserId(userId);
      if (!driver) throw notFound('driver');

      // Validate data
      if (!data || !data.currentLocation.coordinates || data.currentLocation.coordinates.length < 2)
        throw new AppError('Invalid data location', 400, ERROR_CODES.INVALID_LOCATION_DATA);

      const [lat, lng] = data.currentLocation.coordinates;
      /** Validation location data (type, latitude, longitude) */
      updateLocationSchema.parse({
        currentLocation: {
          type: data.currentLocation.type,
          coordinates: [lng, lat],
        },
      });

      /** Save locations in Redis caching  */
      await saveLocationInRedis(driver._id, [lat, lng]);

      // Get drivers location from redis
      const location = await getDriverLocationFromRedis(driver._id);
      const filtered = await DtoService.formatDriver(driver);
      /** Emit LOCATION_UPDATED to admin */
      await NotificationService.send(
        'admins',
        SOCKET_EVENTS.DRIVER.LOCATION_UPDATED,
        {
          ...filtered,
          currentLocation: {
            type: 'Point',
            coordinates: [Number(location.lat), Number(location.lng)],
          },
        },
        userId,
        false
      );

      return driver;
    } catch (error) {
      /** If a validation error occurs, notify the client and stop the update process */
      if (error.name === 'ZodError') {
        console.warn(`Validation error ${error.message}`);

        const payload = {
          code: 'VALIDATION_ERROR',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );

        return;
      }

      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const payload = {
          code: 'DRIVER_NOT_FOUND',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return;
      }

      /** For unexpected errors, notify admins and send a socket event to the driver */
      console.error('Error in Location Update:', error);
      const systemErrorPayload = NotificationPayloads.systemError(error.message);
      /** Send notification to admin */
      await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.SYSTEM, systemErrorPayload);
      /** Send a socket event to user */
      await NotificationService.send(
        'driver',
        SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
        {
          code: 'SYSTEM_ERROR',
          message: 'System error',
        },
        userId,
        false
      );

      return;
    }
  }

  /**
   *  Start Driver Tracking
   * @param {string} userId
   * @returns {object}
   */
  static async startDriverTracking(userId) {
    try {
      const driver = await fetchDriverByUserId(userId);
      if (!driver) throw notFound('driver');

      return driver;
    } catch (error) {
      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const payload = {
          code: 'DRIVER_NOT_FOUND',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return;
      }
    }
  }

  /**
   * Stop Driver Tracking And Remove Driver Locations From Redis
   * @param {string} userId
   * @returns {string}
   */
  static async stopDriverTracking(userId) {
    try {
      const driver = await fetchDriverByUserId(userId);
      if (!driver) throw notFound('driver');

      /** Save Last Location in DB */
      const location = await getDriverLocationFromRedis(driver._id);
      const data = {
        currentLocation: {
          type: 'Point',
          coordinates: [Number(location.lat), Number(location.lng)],
        },
      };
      await updateDriverLocation(driver._id, data);

      /** Remove Driver Location From Redis */
      await deleteDriverLocationFromRedis(driver._id);

      return driver;
    } catch (error) {
      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const payload = {
          code: 'DRIVER_NOT_FOUND',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return;
      }
    }
  }
}
