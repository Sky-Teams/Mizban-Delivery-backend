import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { OfferModel } from '#modules/offers/models/offer.model.js';
import { getOrderById, increaseDriverIndex } from '#modules/orders/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
import { DbJobService } from '#shared/utils/dbJob.service.js';
import { DRIVER_STATUS, OFFER_STATUS, ORDER_STATUS } from '#shared/utils/enums.js';
import { createOfferSchema } from '../../dto/create-offer.schema.js';

/**
 * Create a new offer for an order in the system.
 * This function is intended to be used internally by other services,
 * not via an API route, so validation is performed here in the service layer.
    @param {String} orderId 
    @param {String} driverId
    @returns {Object}  offer object
 */
export const createOffer = async (orderId, driverId) => {
  try {
    const orderOffer = { order: orderId.toString(), driver: driverId.toString() }; // We convert to string, because from most places we send objectId
    createOfferSchema.parse(orderOffer);

    const newOrderOffer = await OfferModel.create(orderOffer);
    return newOrderOffer;
  } catch (error) {
    console.log('Error creating orderOffer. ', error);
    throw error;
  }
};

export const getOffer = async (orderId, driverId) => {
  const orderOffer = { order: orderId.toString(), driver: driverId.toString() }; // We convert to string, because from most places we send objectId
  createOfferSchema.parse(orderOffer);

  const offer = await OfferModel.findOne(orderOffer);
  return offer;
};

const acceptAnOffer = async (session, offerId, userId) => {
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  // Atomic update
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: OFFER_STATUS.PENDING },
    { status: OFFER_STATUS.ACCEPTED },
    { new: true, session }
  );

  if (!offer)
    throw new AppError(
      'Offer already handled or not yours',
      400,
      ERROR_CODES.OFFER_HANDLED_OR_NOT_YOURS
    );

  // Update the status of order.
  const order = await getOrderById(offer.order);

  if (order.status !== ORDER_STATUS.CREATED) {
    throw new AppError(
      `Cannot assign driver. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
    );
  }

  order.status = ORDER_STATUS.ASSIGNED;
  order.driverId = driver._id;
  order.timeline.assignedAt = new Date();
  await order.save({ session });

  //TODO: Does we need to check the status of the driver in here? For now, no we dont need it.

  // Update the status of driver
  driver.status = DRIVER_STATUS.ASSIGNED;

  // Increase the number of active orders
  driver.activeOrders = driver.activeOrders + 1;
  await driver.save({ session });

  //TODO We need to send notification to admins.

  await DbJobService.cancelOfferTimeout(offerId);
  return offer;
};

const rejectAnOffer = async (session, offerId, userId) => {
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: OFFER_STATUS.PENDING },
    { status: OFFER_STATUS.REJECTED },
    { new: true, session }
  );

  if (!offer)
    throw new AppError(
      'Offer already handled or not yours',
      400,
      ERROR_CODES.OFFER_HANDLED_OR_NOT_YOURS
    );

  await increaseDriverIndex(offer.order, session);
  await DbJobService.cancelOfferTimeout(offerId);

  return offer;
};

export const acceptAnOfferWithTransaction = withTransaction(acceptAnOffer);
export const rejectAnOfferWithTransaction = withTransaction(rejectAnOffer);
