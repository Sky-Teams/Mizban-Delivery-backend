import { agenda } from '#config/agenda.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { OfferModel } from '#modules/offers/models/offer.model.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { OfferService } from '#shared/utils/offerService.js';
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
    const orderOffer = { order: orderId, driver: driverId };
    createOfferSchema.parse(orderOffer);

    const orderOfferObject = {
      order: orderId,
      driver: driverId,
      offeredAt: Date.now(), // TODO: Check the UTC format
    };

    const newOrderOffer = await OfferModel.create(orderOfferObject);
    console.log('Offer Id: ', newOrderOffer._id);

    return newOrderOffer;
  } catch (error) {
    console.log('Error creating orderOffer. ', error);
  }
};

export const getOffer = async (orderId, driverId) => {
  const orderOffer = { order: orderId, driver: driverId };
  createOfferSchema.parse(orderOffer);

  const offer = await OfferModel.findOne(orderOffer);
  return offer;
};

export const acceptAnOffer = async (offerId, userId) => {
  console.log('UserId: ', userId);
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');

  // Atomic update
  const o = await OfferModel.findOne({ _id: offerId }).lean();
  console.log('offer: ', o);
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );

  if (!offer) throw new AppError('Offer already handled or not yours', 400);

  // Cancel pending timeout job
  await agenda.cancel({ 'data.offerId': offerId });

  return offer;
};

export const rejectAnOffer = async (offerId, userId) => {
  const driver = await fetchDriverByUserId(userId);
  if (!driver) throw notFound('driver');
  const offer = await OfferModel.findOneAndUpdate(
    { _id: offerId, driver: driver._id, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );

  if (!offer) throw new AppError('Offer already handled or not yours', 400);

  // trigger next driver
  await OfferService.sendOfferToDriver(offer.order, offer.nextDrivers, offer.nextIndex);
  return offer;
};
