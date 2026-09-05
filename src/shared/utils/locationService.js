import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { updateLocationSchema } from '#modules/locations/dto/update-location.schema.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { getDriverOrderByStatus } from '#modules/orders/index.js';
import { startLocationSync, stopLocationSync } from '../../jobs/locationSync.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { DtoService } from './dtoService.js';
import { REDIS_KEYS, SOCKET_EVENTS } from './enums.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService.js';
import { RedisService } from './redisLocationService.js';
import { buildErrorMessages } from './errorMessageBuilder.js';

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

      // Check order existing for driver with pickedUp status
      const order = await getDriverOrderByStatus(driver._id, 'pickedUp');

      if (!order)
        throw new AppError(
          'Driver must have a picked-up order to start tracking',
          400,
          ERROR_CODES.TRACKING_NOT_AVAILABLE
        );

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

      const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driver._id}`;

      /** Save locations in Redis caching  */
      await RedisService.saveDataToRedis(driverLocationKey, {
        lat: String(lat),
        lng: String(lng),
        updatedAt: new Date().toISOString(),
      });

      // Get drivers location from redis
      const location = await RedisService.getRedisData(driverLocationKey);
      const filtered = await DtoService.formatDriver(driver);
      const filterOrderDetail = await DtoService.order(order);

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
          type: filterOrderDetail.type,
          packageDetails: filterOrderDetail.packageDetails,
        },
        userId,
        false
      );

      return driver;
    } catch (error) {
      /** If order not exists, notify to client and stop location update process */
      if (error.status === 400 && error.name !== 'ZodError') {
        console.warn(error);

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'TRACKING_NOT_AVAILABLE',
          message: error.message,
          messages,
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

      /** If a validation error occurs, notify the client and stop the update process */
      if (error.name === 'ZodError') {
        console.warn(`Validation error ${error.message}`);

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'VALIDATION_ERROR',
          message: error.message,
          messages,
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

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'NOT_FOUND',
          message: error.message,
          messages,
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
      const { messages } = buildErrorMessages(error.code);
      await NotificationService.send(
        'driver',
        SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
        {
          code: 'SYSTEM_ERROR',
          message: 'System error',
          messages,
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
   * @returns
   */
  static async startDriverTracking(userId) {
    try {
      const driver = await fetchDriverByUserId(userId);
      if (!driver) throw notFound('driver');

      const order = await getDriverOrderByStatus(driver._id, 'pickedUp');

      if (!order)
        throw new AppError(
          'Driver must have a picked-up order to start tracking',
          400,
          ERROR_CODES.TRACKING_NOT_AVAILABLE
        );

      /** Start Location Sync With Database */
      await startLocationSync(driver._id);

      return driver;
    } catch (error) {
      /** If a validation error occurs, notify the client and stop the update process */
      if (error.status === 400) {
        console.warn(error);

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'TRACKING_NOT_AVAILABLE',
          message: error.message,
          messages,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return false;
      }

      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'NOT_FOUND',
          message: error.message,
          messages,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return false;
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

      const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driver._id}`;

      /** Save Last Location in DB */
      const location = await RedisService.getRedisData(driverLocationKey);
      const data = {
        currentLocation: {
          type: 'Point',
          coordinates: [Number(location.lat), Number(location.lng)],
        },
      };
      await updateDriverLocation(driver._id, data);

      /** Remove Driver Location From Redis */
      await RedisService.removeRedisData(driverLocationKey);

      /** Stop Location Saving In Database */
      await stopLocationSync(driver._id);

      return driver;
    } catch (error) {
      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const { messages } = buildErrorMessages(error.code);
        const payload = {
          code: 'DRIVER_NOT_FOUND',
          message: error.message,
          messages,
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
