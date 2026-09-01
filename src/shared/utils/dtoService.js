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
    const formattedPickupLocation = this.toLatLng(order?.pickupLocation?.coordinates);
    const formattedDropoffLocation = this.toLatLng(order?.dropoffLocation?.coordinates);

    const filteredOrderField = {
      _id: order?._id,
      type: order?.type,
      serviceType: order?.serviceType,
      sender: { ...order?.sender },
      receiver: { ...order?.receiver },
      pickupLocation: { coordinates: formattedPickupLocation },
      dropoffLocation: { coordinates: formattedDropoffLocation },
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

  /**
   * Converts coordinates from [longitude, latitude] to [latitude, longitude]
   * @param {Array} coordinates
   * @returns [lat, long]
   */
  static toLatLng(coordinates) {
    return [coordinates[1], coordinates[0]];
  }

  /**
   * Filter driver fields
   * @param {Object} driver
   * @returns filtered fields
   */
  static formatDriver(driver) {
    const driverPersonalDetails = driver.user;
    const formattedCoordinates = this.toLatLng(driver.currentLocation.coordinates);
    const filteredDriverField = {
      _id: driver._id,
      vehicleType: driver.vehicleType,
      currentLocation: {
        type: 'Point',
        coordinates: formattedCoordinates,
      },
      name: driverPersonalDetails.name,
      email: driverPersonalDetails.email,
      phone: driverPersonalDetails.phone,
      vehicleRegistrationNumber: driver.vehicleRegistrationNumber,
    };

    return filteredDriverField;
  }
}
