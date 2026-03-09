import { doesDriverExistByDriverId, getDriverStatusByDriverId } from '#modules/drivers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { deliveryRequestUpdateQuery } from '#shared/utils/queryBuilder.js';
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

export const getDeliveryRequestById = async (deliveryRequestId) => {
  const deliveryRequest = await DeliveryRequestModel.findById(deliveryRequestId);
  if (!deliveryRequest) throw notFound('DeliveryRequest');

  return deliveryRequest;
};

export const updateDeliveryRequestInfo = async (deliveryRequestId, deliveryRequestData) => {
  const deliveryRequest = await getDeliveryRequestById(deliveryRequestId);

  if (deliveryRequest.status !== 'created' && deliveryRequest.status !== 'assigned') {
    throw new AppError(
      `Delivery Request can not be updated.Delivery status is ${deliveryRequest.status}`,
      409,
      ERROR_CODES.UPDATE_NOT_AVAILABLE
    );
  }

  const allowedFieldsToUpdate = {
    type: true,
    serviceType: true,
    scheduledFor: true,
    deliveryDeadline: true,
    priority: true,
    sender: true,
    receiver: true,
    pickupLocation: true,
    dropoffLocation: true,
    items: true,
    estimatedPrepTimeMinutes: true,
    packageDetails: true,
    serviceLevel: true,
    paymentType: true,
    paymentStatus: true,
    amountToCollect: true,
    deliveryPrice: true,
  };

  const updateQuery = deliveryRequestUpdateQuery(deliveryRequestData, allowedFieldsToUpdate);

  if (Object.keys(updateQuery).length === 0) {
    throw noFieldsProvidedForUpdate();
  }

  const amountToCollect = Number(
    updateQuery.amountToCollect ?? deliveryRequest.amountToCollect ?? 0
  );
  const deliveryTotal = Number(
    updateQuery['deliveryPrice.total'] ?? deliveryRequest.deliveryPrice.total ?? 0
  );

  updateQuery.finalPrice = amountToCollect + deliveryTotal;

  const updatedDeliveryRequest = await DeliveryRequestModel.findByIdAndUpdate(
    deliveryRequestId,
    { $set: updateQuery },
    { new: true, runValidators: true }
  );

  return updatedDeliveryRequest;
};

export const assignDriver = async (session, deliveryRequestId, driverId) => {
  const delivery = await getDeliveryRequestById(deliveryRequestId);

  if (delivery.status !== 'created') {
    throw new AppError(
      `Cannot assign driver. Delivery status is ${delivery.status}.`,
      409,
      ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
    );
  }

  // const driver = await DriverModel.findById(driverId);
  const driver = await getDriverStatusByDriverId(driverId);

  if (driver.status !== 'idle')
    throw new AppError(
      `Driver is not available. Driver status is ${driver.status}`,
      409,
      ERROR_CODES.DRIVER_NOT_IDLE
    );

  delivery.driverId = driver._id;
  delivery.status = 'assigned';
  delivery.timeline.assignedAt = new Date();

  driver.status = 'assigned';

  await delivery.save({ session });
  await driver.save({ session });

  return delivery;
};

export const pickupDelivery = async (session, deliveryRequestId) => {
  const delivery = await getDeliveryRequestById(deliveryRequestId);

  if (delivery.status !== 'assigned') {
    throw new AppError(
      `Cannot pick up. Delivery status is ${delivery.status}.`,
      409,
      ERROR_CODES.PICKUP_NOT_ALLOWED
    );
  }

  const driver = await getDriverStatusByDriverId(delivery.driverId);

  delivery.status = 'pickedUp';
  delivery.timeline.pickedUpAt = new Date();

  driver.status = 'delivering';

  await delivery.save({ session });
  await driver.save({ session });

  return delivery;
};

export const deliverDelivery = async (session, deliveryRequestId) => {
  const delivery = await getDeliveryRequestById(deliveryRequestId);

  if (delivery.status !== 'pickedUp') {
    throw new AppError(
      `Cannot deliver. Delivery status is ${delivery.status}.`,
      409,
      ERROR_CODES.DELIVERY_NOT_DELIVERABLE
    );
  }

  const driver = await getDriverStatusByDriverId(delivery.driverId);

  delivery.status = 'delivered';
  delivery.timeline.deliveredAt = new Date();

  //TODO We should add more logic in here in future for transaction of money.
  delivery.paymentStatus = 'paid';

  driver.status = 'idle';

  await delivery.save({ session });
  await driver.save({ session });

  return delivery;
};

export const cancelDelivery = async (session, deliveryRequestId, reason) => {
  const delivery = await getDeliveryRequestById(deliveryRequestId);

  // Cannot cancel completed or cancelled deliveries
  if (['delivered', 'cancelled'].includes(delivery.status)) {
    throw new AppError(
      `Cannot cancel delivery. Delivery status is ${delivery.status}.`,
      409,
      ERROR_CODES.CANCEL_NOT_ALLOWED
    );
  }

  // Release driver if exists
  if (delivery.driverId) {
    const driver = await getDriverStatusByDriverId(delivery.driverId);
    driver.status = 'idle';
    await driver.save({ session });
  }

  delivery.status = 'cancelled';
  delivery.timeline.cancelledAt = new Date();
  delivery.paymentStatus = 'failed'; //TODO We should add more logic in here in future.

  if (reason) {
    delivery.cancelReason = reason;
  }

  await delivery.save({ session });

  return delivery;
};

export const assignDriverToDeliveryRequest = withTransaction(assignDriver);

export const pickupDeliveryRequest = withTransaction(pickupDelivery);

export const deliverDeliveryRequest = withTransaction(deliverDelivery);

export const cancelDeliveryRequest = withTransaction(cancelDelivery);
