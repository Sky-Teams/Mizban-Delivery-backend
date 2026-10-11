import { DeliveryBatchModel } from '#modules/deliveryBatch/model/delivery.batch.model.js';
import { activateNextPendingBatch } from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { getOrdersByIds } from '#modules/orders/services/v1/order.service.js';
import { calculateDistanceMeters } from './distance.helper.js';
import { REDIS_KEYS, STOP_TYPE } from './enums.js';
import { RedisService } from './redisLocationService.js';

export class RouteOptimizationService {
  static async activateNextBatch(driverId) {
    const batch = await activateNextPendingBatch(driverId);
    return batch;
  }

  static async optimizeActiveBatchIfNeeded(batch) {
    if (!batch) return null;
    // A route already exists, so no optimization is needed.
    if (batch.routeOrder?.length) return batch;

    const driverLocationKey = `${REDIS_KEYS.DRIVER_LOCATION}${batch.driver}`;
    const driverLocation = await RedisService.getRedisData(driverLocationKey);

    if (!driverLocation) return batch;

    return this.optimizeRoute(batch, [Number(driverLocation.lng), Number(driverLocation.lat)]);
  }

  static async optimizeRoute(batch, driverLocation) {
    const orderStops = await this.createStop(batch);

    const isValid = this.validateStops(orderStops);

    if (!isValid) return false;

    const route = this.buildRoute(orderStops, driverLocation);

    if (!route) return null;

    if (route.length !== orderStops.length) {
      return false;
    }

    if (!this.validateRouteOrder(route)) {
      return false;
    }

    const updatedBatch = await DeliveryBatchModel.findByIdAndUpdate(
      batch._id,
      { $set: { routeOrder: route } },
      { new: true, runValidators: true }
    );

    return updatedBatch;
  }

  static buildRoute(stops, currentLocation) {
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
    const pickedUpOrderIds = new Set();
    const route = [];

    while (remainingStops.length > 0) {
      const eligibleStops = this.getEligibleStops(remainingStops, pickedUpOrderIds);

      if (eligibleStops.length === 0) break;

      const stopsWithDistance = this.calculateStopDistance(eligibleStops, currentLocation);

      const nearStop = this.getNearestStop(stopsWithDistance);

      if (!nearStop) break;

      const sameLocationStops = this.getSameLocationStops(eligibleStops, nearStop);

      for (const stop of sameLocationStops) {
        route.push(stop);

        if (stop.type === STOP_TYPE.PICKUP) {
          pickedUpOrderIds.add(stop.orderId.toString());
        }

        const index = remainingStops.findIndex(
          (remainingStop) =>
            remainingStop.orderId.toString() === stop.orderId.toString() &&
            remainingStop.type === stop.type
        );

        if (index !== -1) {
          remainingStops.splice(index, 1);
        }
      }

      currentLocation = nearStop.location;
    }

    return route;
  }

  static getEligibleStops(remainingStops, pickedUpOrderIds) {
    return remainingStops.filter((stop) => {
      if (stop.type === STOP_TYPE.PICKUP) {
        return true;
      }

      if (stop.type === STOP_TYPE.DELIVERY) {
        return pickedUpOrderIds.has(stop.orderId.toString());
      }

      return false;
    });
  }

  static calculateStopDistance(stops, currentLocation) {
    return stops.map((stop) => {
      return {
        ...stop,
        distance: calculateDistanceMeters(stop.location, currentLocation),
      };
    });
  }

  static getNearestStop(stops) {
    if (!stops.length) return null;

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
        stop.type === selectedStop.type &&
        stop.location[0] === selectedStop.location[0] &&
        stop.location[1] === selectedStop.location[1]
    );
  }

  static async createStop(batch) {
    const orders = await getOrdersByIds(batch.orderIds);

    const stops = [];

    for (const order of orders) {
      stops.push(
        {
          orderId: order._id,
          type: STOP_TYPE.PICKUP,
          location: order.pickupLocation.coordinates,
        },
        {
          orderId: order._id,
          type: STOP_TYPE.DELIVERY,
          location: order.dropoffLocation.coordinates,
        }
      );
    }

    return stops;
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
        !allowedTypes.includes(stop.type) ||
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

      if (stop.type === STOP_TYPE.PICKUP) {
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

  static validateRouteOrder(route) {
    if (!Array.isArray(route) || route.length === 0) {
      return false;
    }

    const orderMap = new Map();

    for (let index = 0; index < route.length; index++) {
      const stop = route[index];

      if (!stop?.orderId || ![STOP_TYPE.PICKUP, STOP_TYPE.DELIVERY].includes(stop.type)) {
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

      if (stop.type === STOP_TYPE.PICKUP) {
        if (order.pickupIndex !== null) return false;
        order.pickupIndex = index;
      } else {
        if (order.deliveryIndex !== null) return false;
        order.deliveryIndex = index;
      }
    }

    for (const order of orderMap.values()) {
      if (
        order.pickupIndex === null ||
        order.deliveryIndex === null ||
        order.pickupIndex >= order.deliveryIndex
      ) {
        return false;
      }
    }

    return true;
  }
}
