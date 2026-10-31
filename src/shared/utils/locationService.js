import { CustomSocket } from '#config/socket.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { updateLocationSchema } from '#modules/locations/dto/update-location.schema.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { getDriverOrdersByStatus } from '#modules/orders/index.js';
import { startLocationSync, stopLocationSync } from '../../jobs/locationSync.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { DtoService } from './dtoService.js';
import {
  BATCH_CONFIG,
  EVENT_BUS_EVENTS,
  ORDER_STATUS,
  REDIS_CHANNEL,
  REDIS_KEYS,
  SERVICE,
  SOCKET_EVENTS,
  STOP_STATUS,
} from './enums.js';
import { RedisService } from './redisLocationService.js';
import { handleLocationError } from './handleLocationError.js';
import { RedisEventPublisher } from '#shared/events/RedisEventPublisher.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { calculateDistanceMeters } from './distance.helper.js';
import { driverActiveBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { isLocationFresh } from './batch.helper.js';

const locationEventPublisher = new RedisEventPublisher(REDIS_CHANNEL.LIVE_LOCATION_CHANNEL);

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

      let orders = await getDriverOrdersByStatus(driver._id, {
        $in: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKEDUP],
      });

      // Validate data
      if (
        !data ||
        !data.currentLocation?.coordinates ||
        data.currentLocation?.coordinates?.length < 2
      )
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

      const updatedAt = new Date().toISOString();
      /** Save locations in Redis caching  */
      await RedisService.saveDataToRedis(driverLocationKey, {
        lat: String(lat),
        lng: String(lng),
        updatedAt,
      });

      // Get drivers location from redis
      const location = await RedisService.getRedisData(driverLocationKey);
      const activeBatch = await driverActiveBatch(driver._id);

      // Route optimization for active batch stops
      if (activeBatch) {
        const optimizationBatchKey = `${REDIS_KEYS.DRIVER_ROUTE_OPTIMIZATION_STARTED}${driver._id}:${activeBatch._id}`;

        const isFirstLocation = await RedisService.setIfNotExists(optimizationBatchKey);

        const isLocationNew = await isLocationFresh(location);
        if (!isLocationNew) return;

        const nextStop = activeBatch.stops.find((stop) => stop.stopStatus === STOP_STATUS.PENDING);
        const deviationMeters = nextStop
          ? calculateDistanceMeters(
              [lng, lat],
              [nextStop.location.coordinates[0], nextStop.location.coordinates[1]]
            )
          : 0;

        if (
          isFirstLocation ||
          !activeBatch?.stops?.length ||
          activeBatch?.stops?.length !== activeBatch.orderIds?.length * 2 ||
          deviationMeters > BATCH_CONFIG.MAX_ROUTE_DEVIATION_METERS
        ) {
          eventBus.emit(EVENT_BUS_EVENTS.DRIVER_LOCATION_AVAILABLE, {
            driverId: driver._id,
          });
        }
      }

      const driverDetails = await DtoService.formatDriver(driver);
      const orderDetails = await Promise.all(orders.map((order) => DtoService.order(order)));

      for (const [index, order] of orders.entries()) {
        const orderDetail = orderDetails[index];

        if (order.source === SERVICE.MIZBAN) {
          /** Publish an event to send details to mizban service*/
          try {
            await locationEventPublisher.publish({
              type: REDIS_CHANNEL.LIVE_LOCATION_CHANNEL,
              data: {
                driverId: driverDetails._id,
                orderId: orderDetail.sourceOrderId,
                location: {
                  lat,
                  lng,
                },
                updatedAt,
              },
            });
          } catch (error) {
            console.error('Failed to publish location event:', error);
          }
        }
      }

      /** Emit LOCATION_UPDATED to admin */
      CustomSocket.sendLiveLocationToAdmins(SOCKET_EVENTS.DRIVER.LOCATION_UPDATED, {
        orders: orderDetails,
        driverDetails: {
          ...driverDetails,
          currentLocation: {
            type: 'Point',
            coordinates: [Number(location.lat), Number(location.lng)],
          },
        },
      });

      return driver;
    } catch (error) {
      await handleLocationError(error, userId);
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

      const orders = await getDriverOrdersByStatus(driver._id, {
        $in: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKEDUP],
      });

      if (!orders.length) return;

      /** Start Location Sync With Database */
      await startLocationSync(driver._id);

      /** Notify the driver frontend to start sending live location updates.*/
      CustomSocket.emitToOnlineUser(userId, SOCKET_EVENTS.DRIVER.START_TRACKING);

      return driver;
    } catch (error) {
      await handleLocationError(error, userId);
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

      if (!location || !Number(location.lat) || !Number(location.lng)) return;

      const data = {
        currentLocation: {
          type: 'Point',
          coordinates: [Number(location.lat), Number(location.lng)],
        },
      };
      await updateDriverLocation(driver._id, data);

      const activeBatch = await driverActiveBatch(driver._id);

      const optimizationBatchKey = `${REDIS_KEYS.DRIVER_ROUTE_OPTIMIZATION_STARTED}${driver._id}:${activeBatch._id}`;

      /** Remove Driver Location From Redis */
      await RedisService.removeRedisData(driverLocationKey);
      await RedisService.removeRedisData(optimizationBatchKey);

      /** Stop Location Saving In Database */
      await stopLocationSync(driver._id);

      return driver;
    } catch (error) {
      await handleLocationError(error, userId);
    }
  }
}
