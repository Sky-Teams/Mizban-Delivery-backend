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
      items: { ...order?.items },
    };

    return filteredOrderField;
  }
}
