import { doesDriverExistByDriverId } from '#modules/drivers/index.js';
import { notFound } from '#shared/errors/error.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { DeliveryRequestModel } from '../../models/deliveryRequest.model.js';

export const createDeliveryRequest = async (deliveryRequestData) => {
  // deliveryRequestData is validated by Zod, so no extra fields can exist

  let status = 'created';
  const timeline = {};

  // Driver validation
  if (deliveryRequestData.driverId) {
    const driver = await doesDriverExistByDriverId(deliveryRequestData.driverId);

    if (!driver) throw notFound('Driver');

    status = 'assigned';
    timeline.assignedAt = new Date();
  }

  // Calculate items total if items exist
  if (deliveryRequestData.items?.length) {
    deliveryRequestData.items = calculateItemsTotal(deliveryRequestData.items);
  }

  // Calculate final price. We can extend it in future
  const amountToCollect = Number(deliveryRequestData.amountToCollect || 0);
  const deliveryTotal = Number(deliveryRequestData.deliveryPrice?.total || 0);

  const finalPrice = amountToCollect + deliveryTotal;

  return await DeliveryRequestModel.create({
    ...deliveryRequestData,
    finalPrice,
    status,
    timeline,
  });
};
