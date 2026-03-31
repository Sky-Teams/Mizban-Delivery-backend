import { OrderOfferModel } from '#modules/orderOffers/models/orderOffer.model.js';
import { createOderOfferSchema } from '../../dto/create-order-offer.schema.js';

/**
 * Create a new offer for an order in the system.
 * This function is intended to be used internally by other services,
 * not via an API route, so validation is performed here in the service layer.
    @param {String} orderId 
    @param {String} driverId
    @returns {Object}  orderOffer object
 */
export const createOrderOffer = async (orderId, driverId) => {
  try {
    const orderOffer = { order: orderId, driver: driverId };
    createOderOfferSchema.parse(orderOffer);

    const orderOfferObject = {
      order: orderId,
      driver: driverId,
      offeredAt: Date.now(), //TODO: Check the UTC format
    };

    const newOrderOffer = await OrderOfferModel.create(orderOfferObject);
    console.log('After creating');

    return newOrderOffer;
  } catch (error) {
    console.log('Error creating orderOffer. ', error);
  }
};

// export const updateOrderOffer = async(orderId)
