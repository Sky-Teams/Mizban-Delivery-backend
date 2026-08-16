import { calculateDistanceMeters } from "#shared/utils/distance.helper.js";

const BASE_FEE = 50;
const METERS_PER_KILOMETER = 1000;
const PRICE_PER_KILOMETER = 10;

export const calculateDeliveryPrice = (orderData) => {
  const frontendDeliveryTotal = Number(orderData.deliveryPrice?.total || 0);

  // If frontend already sends delivery price, then we should have that, 
  if (frontendDeliveryTotal > 0) {
    return {
      baseFee: BASE_FEE,
      distanceKm: 0,
      distanceFee: 0,
      total: frontendDeliveryTotal,
    };
  }

  
  // if the delivery price is not sent via front then we will calculate that based on the coordinates  
  const distanceMeters = calculateDistanceMeters(
    orderData.pickupLocation.coordinates,
    orderData.dropoffLocation.coordinates
  );

  const distanceKm = Number((distanceMeters / METERS_PER_KILOMETER).toFixed(2));

  const steps = Math.ceil(distanceMeters / METERS_PER_KILOMETER);
  const distanceFee = steps * PRICE_PER_KILOMETER;

  const total = BASE_FEE + distanceFee;

  return {
    baseFee: BASE_FEE,
    distanceKm,
    distanceFee,
    total,
  };
};