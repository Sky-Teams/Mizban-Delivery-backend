import { agenda } from '#config/agenda.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { OfferModel } from '#modules/offers/models/offer.model.js';
import { getOrderById, increaseDriverIndex } from '#modules/orders/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { withTransaction } from '#shared/middleware/transactionHandler.js';
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
  const orderOffer = { order: orderId.toString(), driver: driverId.toString() }; // We convert the orderId and driverId to string because objectId is throw error when validating
  createOfferSchema.parse(orderOffer);

  const offer = await OfferModel.findOne(orderOffer);
  return offer;
};

const acceptAnOffer = async (session, offerId, userId) => {
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  // Atomic update
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: 'pending' },
    { status: 'accepted' },
    { new: true, session }
  );

  if (!offer)
    throw new AppError(
      'Offer already handled or not yours',
      400,
      ERROR_CODES.OFFER_HANDLED_OR_NOT_YOURS
    );

  //Update the status of order. TODO => Maybe we dont need to check it, because we checked the offer
  const order = await getOrderById(offer.order);

  if (order.status !== 'created') {
    throw new AppError(
      `Cannot assign driver. Order status is ${order.status}.`,
      409,
      ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
    );
  }

  order.status = 'assigned';
  order.driverId = driver._id;
  await order.save({ session });

  //TODO: Does we need to check the status of the driver in here?
  // Update the status of driver
  driver.status = 'assigned';
  //TODO: Increase the number of active orders
  driver.activeOrders = driver.activeOrders + 1;
  await driver.save({ session });

  //TODO: Calculate the acceptanceRate

  // Cancel timeout job
  await agenda.cancel({ name: 'offer:timeout', 'data.offerId': offerId });

  return offer;
};

const rejectAnOffer = async (session, offerId, userId) => {
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: 'pending' },
    { status: 'rejected' },
    { new: true, session }
  );

  if (!offer)
    throw new AppError(
      'Offer already handled or not yours',
      400,
      ERROR_CODES.OFFER_HANDLED_OR_NOT_YOURS
    );

  //TODO:Calculate the acceptance Rate

  await increaseDriverIndex(offer.order, session);

  //TODO: I am not sure about this.Should we cancel it, I think, we need to cancel it.

  await agenda.cancel({ name: 'offer:timeout', 'data.offerId': offerId });

  return offer;
};

export const acceptAnOfferWithTransaction = withTransaction(acceptAnOffer);
export const rejectAnOfferWithTransaction = withTransaction(rejectAnOffer);
