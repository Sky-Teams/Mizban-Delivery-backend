import { CustomSocket } from '#config/socket.js';
import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { driverActiveBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import {
  fetchDriverByDriverId,
  fetchDriverByUserId,
  getDriverLocationByDriverId,
} from '#modules/drivers/index.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { getEstimatedReadyAt, isLocationFresh, ordersWithStops } from './batch.helper.js';
import { calculateDistanceMeters } from './distance.helper.js';
import {
  BATCH_STATUS,
  EVENT_BUS_EVENTS,
  ORDER_STATUS,
  REDIS_KEYS,
  SOCKET_EVENTS,
  STOP_STATUS,
  STOP_TYPE,
} from './enums.js';
import { RedisService } from './redisLocationService.js';

export class RouteOptimizationService {
  // Mark pickup stop as completed
  static async completePickUpStop(driverId, orderId) {
    try {
      const driver = await fetchDriverByDriverId(driverId);
      if (!driver) throw notFound('driver');

      const activeBatch = await driverActiveBatch(driverId);

      if (!activeBatch.stops.length) return;

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

      // Reset the distance baseline to the driver's current location, only for the first pickup completed in the batch
      const completedPickups = (updateBatch.stops ?? []).filter(
        (stop) => stop.stopType === STOP_TYPE.PICKUP && stop.stopStatus === STOP_STATUS.COMPLETED
      );

      if (completedPickups.length === 1) {
        const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${driverId}`;
        const currentLocation = await RedisService.getRedisData(driverLocationKey);

        if (currentLocation && Number(currentLocation?.lat) && Number(currentLocation?.lng)) {
          await RedisService.saveDataToRedis(driverLocationKey, {
            lat: String(currentLocation.lat),
            lng: String(currentLocation.lng),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Resend route optimized
      const payload = await ordersWithStops(updateBatch);
      CustomSocket.emitToOnlineUser(driver.user._id, SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, payload);

      return updateBatch;
    } catch (error) {
      console.error('Error in complete pickup stop:', error);
    }
  }

  // Mark deliver stop as completed
  static async completeDeliveryStop(driverId, orderId) {
    try {
      const driver = await fetchDriverByDriverId(driverId);
      if (!driver) throw notFound('driver');

      const activeBatch = await driverActiveBatch(driverId);

      if (!activeBatch.stops.length) return;

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

      // Resend route optimized
      const payload = await ordersWithStops(updateBatch);
      CustomSocket.emitToOnlineUser(driver.user._id, SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, payload);

      return updateBatch;
    } catch (error) {
      console.error('Error in complete delivery stop:', error);
    }
  }

  // Update orderIds in batch when an order cancelled or returned
  static async cancelledOrReturnedDeliveryBatchOrder(driverId, orderId) {
    try {
      const driver = await fetchDriverByDriverId(driverId);
      if (!driver) throw notFound('driver');

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
        await DeliveryBatchModel.findByIdAndUpdate(
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

        eventBus.emit(EVENT_BUS_EVENTS.STOP_DRIVER_TRACKING, { userId: driver.user._id });

        return;
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

      // Re-optimization routes and send it to driver
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
      let location = await RedisService.getRedisData(driverLocationKey);
      // Check location is old or new
      const isLocationNew = await isLocationFresh(location);

      // If driver location in Redis does not exist or old, Use driver location in database to route optimization
      if (!isLocationNew || location.lng == null || location.lat == null) {
        const lastDriverLocation = await getDriverLocationByDriverId(driverId);
        location = {
          lng: lastDriverLocation?.currentLocation?.coordinates[0],
          lat: lastDriverLocation?.currentLocation?.coordinates[1],
        };
      }

      if (
        !location ||
        location.lng == null ||
        location.lat == null ||
        !Number.isFinite(Number(location.lng)) ||
        !Number.isFinite(Number(location.lat))
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

      // Save last optimization location in redis
      const updatedAt = new Date().toISOString();
      await RedisService.saveDataToRedis(
        `${REDIS_KEYS.DRIVER_LAST_OPTIMIZATION_LOCATION}${driverId}`,
        {
          lat: String(location.lat),
          lng: String(location.lng),
          updatedAt,
        }
      );

      // Send orders with stops to driver
      CustomSocket.emitToOnlineUser(driver.user._id, SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, payload);

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
      CustomSocket.emitToOnlineUser(userId, SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, payload);
    } catch (error) {
      console.error('Error to send active batch to driver:', error);
    }
  }

  /**
   * Builds an optimized route using a Greedy approach followed by 2-opt optimization.
   * First, constructs an initial route by selecting eligible stops based on their
   * estimated ready times while respecting pickup and delivery dependencies.
   * Then, applies the 2-opt algorithm to reduce the total route distance by
   * rearranging stops without violating pickup-before-delivery constraints.
   *
   * @param {Array} stops - List of available stops.
   * @param {Array<number>} currentLocation - Driver's current coordinates [lng, lat].
   * @param {Array<string>} completedPickupOrderIds - IDs of orders already picked up.
   * @returns {Array} Optimized route, or null if the input is invalid.
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

    // Build initial route using Greedy algorithm
    const greedyRoute = this.buildGreedyRoute(stops, completedPickupOrderIds);

    // Optimize route using 2-opt algorithm
    const optimizedRoute = this.optimizeRouteWith2Opt(greedyRoute, currentLocation);

    return optimizedRoute;
  }

  static buildGreedyRoute(stops, completedPickupOrderIds = []) {
    const route = [];
    const remainingStops = [...stops];
    const pickedUpOrderIds = new Set(completedPickupOrderIds);

    while (remainingStops.length) {
      const eligibleStops = this.getEligibleStops(remainingStops, pickedUpOrderIds);

      if (!eligibleStops.length) break;

      // Select based only on estimatedReadyAt
      const nextStop = this.getBestNextStop(eligibleStops);
      if (!nextStop) break;

      route.push(nextStop);

      if (nextStop.stopType === STOP_TYPE.PICKUP) {
        pickedUpOrderIds.add(nextStop.orderId.toString());
      }

      const selectedIndex = remainingStops.findIndex(
        (stop) =>
          stop.orderId.toString() === nextStop.orderId.toString() &&
          stop.stopType === nextStop.stopType
      );

      if (selectedIndex !== -1) {
        remainingStops.splice(selectedIndex, 1);
      }
    }

    return route;
  }

  static optimizeRouteWith2Opt(route, currentLocation) {
    if (route.length < 3) return route;

    let optimizedRoute = [...route];
    let improved = true;

    while (improved) {
      improved = false;

      const currentDistance = this.calculateRouteDistance(optimizedRoute, currentLocation);

      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        for (let j = i + 1; j < optimizedRoute.length; j++) {
          const newRoute = [
            ...optimizedRoute.slice(0, i),
            ...optimizedRoute.slice(i, j + 1).reverse(),
            ...optimizedRoute.slice(j + 1),
          ];

          if (!this.validateRouteOrder(newRoute)) continue;

          const newDistance = this.calculateRouteDistance(newRoute, currentLocation);

          if (newDistance < currentDistance) {
            optimizedRoute = newRoute;
            improved = true;
            break;
          }
        }

        if (improved) break;
      }
    }

    return optimizedRoute;
  }

  static calculateRouteDistance(route, currentLocation) {
    let totalDistance = 0;
    let previousLocation = currentLocation;

    for (const stop of route) {
      totalDistance += calculateDistanceMeters(previousLocation, [
        stop.location.coordinates[0],
        stop.location.coordinates[1],
      ]);

      previousLocation = stop.location.coordinates;
    }
    return totalDistance;
  }

  static getBestNextStop(stops) {
    if (!stops.length) return null;

    return [...stops].sort((a, b) => {
      const timeA = new Date(a.estimatedReadyAt).getTime();
      const timeB = new Date(b.estimatedReadyAt).getTime();

      return timeA - timeB;
    })[0];
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

      const stopLocation = plainStop.location.coordinates;

      const distance = calculateDistanceMeters(currentLocation, stopLocation);
      return {
        ...plainStop,
        distance,
      };
    });
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

    const existingStopMap = new Map(
      existingStops.map((stop) => [`${stop.orderId.toString()}-${stop.stopType}`, stop])
    );

    const newStops = [];

    for (const order of orders) {
      const orderId = order._id.toString();
      const estimatedReadyAt = getEstimatedReadyAt(order);

      const pickupKey = `${orderId}-${STOP_TYPE.PICKUP}`;
      const deliveryKey = `${orderId}-${STOP_TYPE.DELIVERY}`;

      const existingPickup = existingStopMap.get(pickupKey);

      if (existingPickup) {
        existingPickup.estimatedReadyAt = estimatedReadyAt;
      } else {
        newStops.push({
          orderId: order._id,
          stopType: STOP_TYPE.PICKUP,
          location: order.pickupLocation,
          stopStatus: [ORDER_STATUS.PICKEDUP, ORDER_STATUS.DELIVERED].includes(order.status)
            ? STOP_STATUS.COMPLETED
            : STOP_STATUS.PENDING,
          estimatedReadyAt,
        });
      }

      if (!existingStopMap.has(deliveryKey)) {
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

    let previousReadyAt = -Infinity;

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

        const readyAt = new Date(stop.estimatedReadyAt).getTime();

        if (!Number.isFinite(readyAt)) return false;

        // Preserve Pickup order based on estimatedReadyAt.
        if (readyAt < previousReadyAt) return false;

        previousReadyAt = readyAt;
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
