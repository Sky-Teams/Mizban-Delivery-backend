import { OfferModel } from '#modules/offers/models/offer.model.js';
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
    // console.log('After creating');

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
