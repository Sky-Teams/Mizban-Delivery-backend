import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { driverActiveBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { isLocationFresh } from './batch.helper.js';
import { calculateDistanceMeters } from './distance.helper.js';
import { BATCH_STATUS, REDIS_KEYS, STOP_STATUS, STOP_TYPE } from './enums.js';
import { RedisService } from './redisLocationService.js';

export class RouteOptimizationService {
  // Mark pickup stop as completed
  static async completePickUpStop(driverId, orderId) {
    const updateBatch = await DeliveryBatchModel.findOneAndUpdate(
      {
        driver: driverId,
        status: BATCH_STATUS.ACTIVE,
      },
      {
        $set: {
          'stops.$[stop].stopStatus': STOP_STATUS.COMPLETED,
        },
      },
      {
        arrayFilters: [
          {
            'stop.orderId': orderId,
            'stop.stopType': STOP_TYPE.PICKUP,
            'stop.stopStatus': STOP_STATUS.PENDING,
          },
        ],
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
  }

  // Mark deliver stop as completed
  static async completeDeliveryStop(driverId, orderId) {
    const updateBatch = await DeliveryBatchModel.findOneAndUpdate(
      {
        driver: driverId,
        status: BATCH_STATUS.ACTIVE,
      },
      {
        $set: {
          'stops.$[stop].stopStatus': STOP_STATUS.COMPLETED,
        },
      },
      {
        arrayFilters: [
          {
            'stop.orderId': orderId,
            'stop.stopType': STOP_TYPE.DELIVERY,
            'stop.stopStatus': STOP_STATUS.PENDING,
          },
        ],
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
  }

  static async optimizeRoute(driverId) {
    const activeBatch = await driverActiveBatch(driverId);
    if (!activeBatch) return;

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
    // Separate completed and pending stops
    const allStops = [...(activeBatch.stops ?? []), ...newStops];
    if (!allStops.length) return;

    const completedStops = allStops?.filter((stop) => stop.stopStatus === STOP_STATUS.COMPLETED);

    const pendingStops = allStops?.filter((stop) => stop.stopStatus === STOP_STATUS.PENDING);

    // Validate pending stops
    const isValid = this.validateStops(allStops);

    if (!isValid) {
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
      return;
    }

    // Preserve completed stops
    const optimizedRoute = [...completedStops, ...route];

    // Save the optimized route
    const updatedBatch = await DeliveryBatchModel.findByIdAndUpdate(
      activeBatch._id,
      { $set: { stops: optimizedRoute } },
      { new: true, runValidators: true }
    );

    return updatedBatch;
  }

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

      currentLocation = nearStop.location;
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
        distance: calculateDistanceMeters(plainStop.location, currentLocation),
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
        stop.location[0] === selectedStop.location[0] &&
        stop.location[1] === selectedStop.location[1]
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
          location: order.pickupLocation.coordinates,
          stopStatus: STOP_STATUS.PENDING,
        });
      }

      if (!existingStopKeys.has(`${orderId}-${STOP_TYPE.DELIVERY}`)) {
        newStops.push({
          orderId: order._id,
          stopType: STOP_TYPE.DELIVERY,
          location: order.dropoffLocation.coordinates,
          stopStatus: STOP_STATUS.PENDING,
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
        !Array.isArray(stop.location) ||
        stop.location.length !== 2 ||
        !stop.location.every(
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
