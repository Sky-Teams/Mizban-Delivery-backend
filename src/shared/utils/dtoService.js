/**
 * A centralized service for DTO
 */
export class DtoService {
  /**
   * Filter the fields of an order and return the necessary fields
   * @param {Object} order - Order Object
   * @returns filtered fields
   */
  static order(order) {
    if (!order) return {};

    const filteredOrderField = {
      _id: order?._id,
      type: order?.type,
      serviceType: order?.serviceType,
      sender: { ...order?.sender },
      receiver: { ...order?.receiver },
      pickupLocation: { coordinates: order?.pickupLocation?.coordinates },
      dropoffLocation: { coordinates: order?.dropoffLocation?.coordinates },
      packageDetails: { ...order?.packageDetails },
      paymentType: order?.paymentType,
      amountToCollect: order?.amountToCollect,
      deliveryPrice: order?.deliveryPrice?.total,
      finalPrice: order?.finalPrice,
      items: [...order?.items],
      status: order?.status,
      reason: order?.reason,
      offer: order?.offer,
    };

    return filteredOrderField;
  }

  /**
   * Map offers with their orders
   * @param {Array} offers
   * @returns mapped orders
   */
  static mapOfferOrders = (offers) => {
    return offers.map((offer) => ({
      ...offer.order,
      offer: {
        _id: offer._id,
        status: offer.status,
        offeredAt: offer.offeredAt,
        respondedAt: offer.respondedAt,
      },
    }));
  };
}
