import { calculateDistanceMeters } from './distance.helper.js';
import { BATCH_CONFIG } from './enums.js';

/** Calculate pick up distance between orders */
export const isPickupCompatible = (currentOrder, newOrder) => {
  const currentOrderLocation = currentOrder.pickupLocation.coordinates;
  const newOrderLocation = newOrder.pickupLocation.coordinates;

  const distance = calculateDistanceMeters(currentOrderLocation, newOrderLocation);
  return distance <= BATCH_CONFIG.MAX_PICKUP_DISTANCE_METERS;
};

/** Calculate delivery distance between orders */
export const isDeliveryCompatible = (currentOrder, newOrder) => {
  const currentOrderLocation = currentOrder.dropoffLocation.coordinates;
  const newOrderLocation = newOrder.dropoffLocation.coordinates;

  const distance = calculateDistanceMeters(currentOrderLocation, newOrderLocation);
  return distance <= BATCH_CONFIG.MAX_DELIVERY_DISTANCE_METERS;
};

/** Check preparation time */
export const isPreparationCompatible = (currentOrder, newOrder) => {
  const preparationTimeCurrentOrder = getEstimatedReadyAt(currentOrder);
  const preparationTimeNewOrder = getEstimatedReadyAt(newOrder);

  const timeDiff = getTimeDifferenceInMinutes(preparationTimeCurrentOrder, preparationTimeNewOrder);
  return timeDiff <= BATCH_CONFIG.MAX_PREPARATION_MINUTE;
};

/** Check maximum orders in batch model */
export const isBatchSizeAvailable = (batchOrders) => {
  const orderJobs = batchOrders?.orderIds?.length;

  return orderJobs < BATCH_CONFIG.MAX_BATCH_SIZE;
};

export const getEstimatedReadyAt = (order) => {
  const createdAt = order.createdAt.getTime();
  const estimatedPrep = order.estimatedPrepTimeMinutes * 60 * 1000;

  return new Date(createdAt + estimatedPrep);
};

/** Calculate the difference between two dates in minutes */
export const getTimeDifferenceInMinutes = (dateA, dateB) => {
  const differenceMs = Math.abs(dateA.getTime() - dateB.getTime());

  return differenceMs / (60 * 1000);
};

// Check driver Location fresh
export const isLocationFresh = async (location) => {
  const MAX_LOCATION_AGE = 5 * 60 * 1000; // 5 min
  const locationAge = location?.updatedAt
    ? new Date() - new Date(location.updatedAt).getTime()
    : Infinity;
  const isLocationNew =
    Number.isFinite(locationAge) && locationAge >= 0 && locationAge <= MAX_LOCATION_AGE;

  return isLocationNew;
};
