import { CustomSocket } from '#config/socket.js';
import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { driverActiveBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { fetchDriverByDriverId, fetchDriverByUserId } from '#modules/drivers/index.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { isLocationFresh, ordersWithStops } from './batch.helper.js';
import { calculateDistanceMeters } from './distance.helper.js';
import { BATCH_STATUS, ORDER_STATUS, REDIS_KEYS, STOP_STATUS, STOP_TYPE } from './enums.js';
import { RedisService } from './redisLocationService.js';

export class RouteOptimizationService {
  // Mark pickup stop as completed
  static async completePickUpStop(driverId, orderId) {
    try {
      const updateBatch = await DeliveryBatchModel.findOneAndUpdate(
        {
          driver: driverId,
          status: BATCH_STATUS.ACTIVE,
          stops: {
            $elemMatch: {
              orderId,
              stopStatus: STOP_STATUS.PENDING,
              stopType: STOP_TYPE.PICKUP,
            },
          },
        },
        {
          $set: {
            'stops.$.stopStatus': STOP_STATUS.COMPLETED,
          },
        },
        {
          returnDocument: 'after',
        }
      );

      if (!updateBatch)
        throw new AppError(
          'Active batch or pending pickup stop not found',
          404,
          ERROR_CODES.PICKUP_NOT_ALLOWED
        );

      return updateBatch;
    } catch (error) {
      console.error('Error in complete pickup stop:', error);
    }
  }

  // Mark deliver stop as completed
  static async completeDeliveryStop(driverId, orderId) {
    try {
      const updateBatch = await DeliveryBatchModel.findOneAndUpdate(
        {
          driver: driverId,
          status: BATCH_STATUS.ACTIVE,
          stops: {
            $elemMatch: {
              orderId,
              stopStatus: STOP_STATUS.PENDING,
              stopType: STOP_TYPE.DELIVERY,
            },
          },
        },
        {
          $set: {
            'stops.$.stopStatus': STOP_STATUS.COMPLETED,
          },
        },
        {
          returnDocument: 'after',
        }
      );

      if (!updateBatch)
        throw new AppError(
          'Active batch or pending delivery stop not found',
          404,
          ERROR_CODES.DELIVERY_NOT_DELIVERABLE
        );

      return updateBatch;
    } catch (error) {
      console.error('Error in complete delivery stop:', error);
    }
  }

  // Update orderIds in batch when an order cancelled or returned
  static async cancelledOrReturnedDeliveryBatchOrder(driverId, orderId) {
    try {
      const activeBatch = await driverActiveBatch(driverId);
      if (!activeBatch)
        throw new AppError('Active batch not found', 404, ERROR_CODES.DELIVERY_BATCH_NOT_AVAILABLE);

      const newOrderIds = activeBatch.orderIds?.filter(
        (id) => id.toString() !== orderId.toString()
      );
      const newStops = activeBatch?.stops?.filter(
        (stop) => stop.orderId.toString() !== orderId.toString()
      );

      if (!newOrderIds?.length) {
        return await DeliveryBatchModel.findByIdAndUpdate(
          activeBatch._id,
          {
            $set: {
              orderIds: [],
              stops: [],
              status: BATCH_STATUS.COMPLETED,
              completedAt: new Date(),
            },
          },
          {
            returnDocument: 'after',
            runValidators: true,
          }
        );
      }

      await DeliveryBatchModel.findByIdAndUpdate(
        activeBatch._id,
        {
          $set: {
            orderIds: newOrderIds,
            stops: newStops,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        }
      );

      return await this.optimizeRoute(driverId);
    } catch (error) {
      console.log('Error in cancel and return order at delivery batch:', error);
    }
  }

  static async optimizeRoute(driverId) {
    try {
      const driver = await fetchDriverByDriverId(driverId);
      if (!driver) throw notFound('driver');

      const activeBatch = await driverActiveBatch(driverId);
      if (!activeBatch)
        throw new AppError('Active batch not found', 404, ERROR_CODES.DELIVERY_BATCH_NOT_AVAILABLE);

      // Get driver's current location
      const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;
      const location = await RedisService.getRedisData(driverLocationKey);
      // Check location is old or new
      const isLocationNew = await isLocationFresh(location);

      if (
        !location ||
        location.lng == null ||
        location.lat == null ||
        !Number.isFinite(Number(location.lng)) ||
        !Number.isFinite(Number(location.lat)) ||
        !isLocationNew
      ) {
        return;
      }

      const newStops = await this.createStop(activeBatch);
      const allStops = [...(activeBatch.stops ?? []), ...newStops];
      if (!allStops.length) return;

      // Separate completed and pending stops
      const completedStops = allStops?.filter((stop) => stop.stopStatus === STOP_STATUS.COMPLETED);
      const pendingStops = allStops?.filter((stop) => stop.stopStatus === STOP_STATUS.PENDING);

      // Validate stops
      if (!this.validateStops(allStops)) {
        throw new AppError('Invalid batch stops', 400, ERROR_CODES.INVALID_BATCH_STOPS);
      }

      const completedPickupOrderIds = allStops
        .filter(
          (stop) => stop.stopType === STOP_TYPE.PICKUP && stop.stopStatus === STOP_STATUS.COMPLETED
        )
        .map((stop) => stop.orderId.toString());

      const route = this.buildRoute(
        pendingStops,
        [Number(location.lng), Number(location.lat)],
        completedPickupOrderIds
      );

      if (!route || route.length !== pendingStops.length) {
        return;
      }

      // Validate the optimized route
      if (!this.validateRouteOrder(route, completedPickupOrderIds)) {
        throw new AppError('Invalid batch stops', 400, ERROR_CODES.INVALID_BATCH_STOPS);
      }

      const optimizedRoute = [...completedStops, ...route];

      // Save the optimized route
      const updatedBatch = await DeliveryBatchModel.findByIdAndUpdate(
        activeBatch._id,
        { $set: { stops: optimizedRoute } },
        { new: true, runValidators: true }
      );

      const payload = await ordersWithStops(updatedBatch);

      // Send orders with stops to driver
      CustomSocket.sendPayloadToOnlineUser(
        driver.user._id,
        SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED,
        payload
      );

      return updatedBatch;
    } catch (error) {
      console.error('Error in route optimization:', error);
    }
  }

  // Send active batch,and orders  with stops to driver
  static async sendOptimizedRouteToDriver(userId) {
    try {
      const driver = await fetchDriverByUserId(userId);
      if (!driver) throw notFound('driver');

      const activeBatch = await driverActiveBatch(driver._id);
      if (!activeBatch || !activeBatch.orderIds.length || !activeBatch.stops.length) return;

      const payload = await ordersWithStops(activeBatch);
      CustomSocket.sendPayloadToOnlineUser(userId, SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, payload);
    } catch (error) {
      console.error('Error to send active batch to driver:', error);
    }
  }

  /**
   * Builds an optimized route using the nearest-neighbor approach.
   * At each step, selects the nearest eligible stop based on the current location,
   * while ensuring that each order is picked up before being delivered.
   * The current location is updated after each selection, and the process continues until all eligible stops are processed.
   */
  static buildRoute(stops, currentLocation, completedPickupOrderIds = []) {
    if (
      !Array.isArray(stops) ||
      !stops.length ||
      !Array.isArray(currentLocation) ||
      currentLocation.length !== 2 ||
      !currentLocation.every(Number.isFinite)
    ) {
      return null;
    }

    const remainingStops = [...stops];
    const pickedUpOrderIds = new Set(completedPickupOrderIds);
    const route = [];

    while (remainingStops.length > 0) {
      const eligibleStops = this.getEligibleStops(remainingStops, pickedUpOrderIds);

      if (!eligibleStops.length) break;

      const stopsWithDistance = this.calculateStopDistance(eligibleStops, currentLocation);

      const nearStop = this.getNearestStop(stopsWithDistance);

      if (!nearStop) break;

      const sameLocationStops = this.getSameLocationStops(eligibleStops, nearStop);

      for (const stop of sameLocationStops) {
        route.push(stop);

        if (stop.stopType === STOP_TYPE.PICKUP) {
          pickedUpOrderIds.add(stop.orderId.toString());
        }

        const index = remainingStops.findIndex(
          (remainingStop) =>
            remainingStop.orderId.toString() === stop.orderId.toString() &&
            remainingStop.stopType === stop.stopType
        );

        if (index === -1) return null;

        remainingStops.splice(index, 1);
      }

      currentLocation = nearStop.location.coordinates;
    }

    return route;
  }

  static getEligibleStops(remainingStops, pickedUpOrderIds) {
    return remainingStops.filter((stop) => {
      if (stop.stopType === STOP_TYPE.PICKUP) {
        return true;
      }
      if (stop.stopType === STOP_TYPE.DELIVERY) {
        return pickedUpOrderIds.has(stop.orderId.toString());
      }
      return false;
    });
  }

  static calculateStopDistance(stops, currentLocation) {
    return stops.map((stop) => {
      const plainStop = typeof stop.toObject === 'function' ? stop.toObject() : stop;

      return {
        ...plainStop,
        distance: calculateDistanceMeters(plainStop.location.coordinates, currentLocation),
      };
    });
  }

  static getNearestStop(stops) {
    if (!stops.length) return;

    let nearestStop = stops[0];
    for (const stop of stops) {
      if (stop.distance < nearestStop.distance) {
        nearestStop = stop;
      }
    }
    return nearestStop;
  }

  static getSameLocationStops(stops, selectedStop) {
    return stops.filter(
      (stop) =>
        stop.stopType === selectedStop.stopType &&
        stop.location.coordinates[0] === selectedStop.location.coordinates[0] &&
        stop.location.coordinates[1] === selectedStop.location.coordinates[1]
    );
  }

  static async createStop(batch) {
    if (!batch?.orderIds?.length) {
      return [];
    }

    const orders = await getOrdersByIds(batch.orderIds);

    if (!Array.isArray(orders) || orders.length !== batch.orderIds.length) {
      return [];
    }

    const existingStops = batch.stops ?? [];

    const existingStopKeys = new Set(
      existingStops.map((stop) => `${stop.orderId.toString()}-${stop.stopType}`)
    );

    const newStops = [];

    for (const order of orders) {
      const orderId = order._id.toString();

      if (!existingStopKeys.has(`${orderId}-${STOP_TYPE.PICKUP}`)) {
        newStops.push({
          orderId: order._id,
          stopType: STOP_TYPE.PICKUP,
          location: order.pickupLocation,
          stopStatus:
            order.status === ORDER_STATUS.PICKEDUP ? STOP_STATUS.COMPLETED : STOP_STATUS.PENDING,
        });
      }

      if (!existingStopKeys.has(`${orderId}-${STOP_TYPE.DELIVERY}`)) {
        newStops.push({
          orderId: order._id,
          stopType: STOP_TYPE.DELIVERY,
          location: order.dropoffLocation,
          stopStatus:
            order.status === ORDER_STATUS.DELIVERED ? STOP_STATUS.COMPLETED : STOP_STATUS.PENDING,
        });
      }
    }

    return newStops;
  }

  static validateStops(orderStops) {
    if (!Array.isArray(orderStops) || orderStops.length === 0) {
      return false;
    }
    const allowedTypes = [STOP_TYPE.PICKUP, STOP_TYPE.DELIVERY];
    const orderMap = new Map();

    for (let index = 0; index < orderStops.length; index++) {
      const stop = orderStops[index];
      if (
        !stop.orderId ||
        !allowedTypes.includes(stop.stopType) ||
        !Array.isArray(stop.location?.coordinates) ||
        stop.location?.coordinates.length !== 2 ||
        !stop.location.coordinates.every(
          (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)
        )
      ) {
        return false;
      }

      const orderId = stop.orderId.toString();
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          pickupIndex: -1,
          deliveryIndex: -1,
        });
      }

      const order = orderMap.get(orderId);
      if (stop.stopType === STOP_TYPE.PICKUP) {
        if (order.pickupIndex !== -1) return false;
        order.pickupIndex = index;
      } else {
        if (order.deliveryIndex !== -1) return false;
        order.deliveryIndex = index;
      }
    }
    for (const order of orderMap.values()) {
      if (order.pickupIndex === -1 || order.deliveryIndex === -1) {
        return false;
      }
    }

    return true;
  }

  static validateRouteOrder(route, completedPickupOrderIds = []) {
    if (!Array.isArray(route) || route.length === 0) {
      return false;
    }

    const pickedUpOrderIds = new Set(completedPickupOrderIds.map((id) => id.toString()));

    const orderMap = new Map();

    for (let index = 0; index < route.length; index++) {
      const stop = route[index];
      if (!stop?.orderId || ![STOP_TYPE.PICKUP, STOP_TYPE.DELIVERY].includes(stop.stopType)) {
        return false;
      }

      const orderId = stop.orderId.toString();

      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          pickupIndex: null,
          deliveryIndex: null,
        });
      }

      const order = orderMap.get(orderId);

      if (stop.stopType === STOP_TYPE.PICKUP) {
        if (order.pickupIndex !== null) return false;
        order.pickupIndex = index;
      } else {
        if (order.deliveryIndex !== null) return false;
        order.deliveryIndex = index;
      }
    }

    for (const [orderId, order] of orderMap) {
      if (order.deliveryIndex === null) return false;

      // Pickup may already be completed.
      if (pickedUpOrderIds.has(orderId)) {
        if (order.pickupIndex !== null) return false;
        continue;
      }

      // Otherwise, both stops must exist in the route.
      if (order.pickupIndex === null || order.pickupIndex >= order.deliveryIndex) {
        return false;
      }
    }

    return true;
  }
}
