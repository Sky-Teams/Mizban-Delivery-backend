import { calculateDistanceMeters } from "#shared/utils/distance.helper.js";

const BASE_FEE = 50;
const METERS_PER_STEP = 1000;
const PRICE_PER_STEP = 10;

export const calculateDeliveryPrice = (orderData) => {
  const distanceMeters = calculateDistanceMeters(
    orderData.pickupLocation.coordinates,
    orderData.dropoffLocation.coordinates
  );

  const distanceKm = Number((distanceMeters / 1000).toFixed(2));
  
  // In evey km charges 10 afghanis
  const steps = Math.ceil(distanceMeters / METERS_PER_STEP);
  const distanceFee = steps * PRICE_PER_STEP;


  // Can have the following in future
  // const priorityFee = 0;
  // const timeFee = 0;
  // const discount = Number(orderData.deliveryPrice?.discount || 0);

  const total = BASE_FEE + distanceFee;

  return {
    baseFee: BASE_FEE,
    distanceKm,
    distanceFee,
    total,
  };
};