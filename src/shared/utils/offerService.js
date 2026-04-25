import { fetchDriverByDriverId } from '#modules/drivers/index.js';
import { createOffer, getOffer } from '#modules/offers/index.js';
import { getOrderById, increaseDriverIndex } from '#modules/orders/index.js';
import { DbJobService } from './dbJob.service.js';
import { DtoService } from './dtoService.js';
import { DRIVER_STATUS, OFFER_STATUS, ORDER_STATUS, SOCKET_EVENTS } from './enums.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService.js';

export class OfferService {
  /**
   * Send offer to a specific driver
   * @param {string} orderId
   */
  static async sendOfferToDriver(orderId) {
    try {
      const order = await getOrderById(orderId);

      // Check if order is still available
      // ex: Driver accept the offer in last seconds and timeout job is executed.
      if (order.status !== ORDER_STATUS.CREATED) return; // It means order is not in created mode, so we cancel the process

      const driversInfo = order.recommendedDrivers;
      const currentIndex = order.currentDriverIndex;

      if (currentIndex >= driversInfo.length) {
        // TODO we must search what should we do if no driver found. for now we just send an notification for all admins
        const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
        await NotificationService.send(
          'admins',
          SOCKET_EVENTS.ADMIN.NO_DRIVER,
          noDriverFoundPayload
        );
        return;
      }

      const driver = await fetchDriverByDriverId(driversInfo[currentIndex].id);
      if (
        !driver ||
        driver.status !== DRIVER_STATUS.IDLE ||
        driver.activeOrders >= driver.maxOrders
      ) {
        await increaseDriverIndex(orderId);
        return await OfferService.sendOfferToDriver(orderId);
      }

      // We need this log for testing purpose
      console.log('Send offer to driver: ', driversInfo[currentIndex].id);

      //TODO: Does we need to store the info about the order details in offer table?
      const offer = await createOffer(orderId, driversInfo[currentIndex].id);

      if (!offer) {
        await increaseDriverIndex(orderId);
        return await OfferService.sendOfferToDriver(orderId);
      }

      // Create Offer payload for the driver to understand the details of the offer
      const orderInfo = DtoService.order(order);
      orderInfo.expiresIn = process.env.Offer_Expires_In_Seconds || 30;
      orderInfo.eta = driversInfo[currentIndex].eta;
      orderInfo.distance = driversInfo[currentIndex].distance;
      const offerPayload = NotificationPayloads.orderOffered(orderInfo);

      // Send offer to driver
      await NotificationService.send(
        'driver',
        SOCKET_EVENTS.DRIVER.OFFER,
        offerPayload,
        driver.user._id
      );

      console.log('Offer Id: ', offer._id); // we need it for test

      await DbJobService.scheduleOfferTimeout(orderId, offer.driver, offer._id);
    } catch (error) {
      // For validation Error, we send offer to next driver without blocking the recommendation service.
      if (error.name === 'ZodError') {
        console.warn(`Validation error: ${error.message}`);
        // We send offer to next driver
        await increaseDriverIndex(orderId);
        return await OfferService.sendOfferToDriver(orderId);
      }

      // For system error, DB error, or other critical errors, its better to stop the process and notify the admin
      console.error('Error in sendOfferToDriver:', error);
      const systemErrorPayload = NotificationPayloads.systemError(error.message);
      await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.SYSTEM, systemErrorPayload);

      return; // We explicitly return to stop more processing
    }
  }

  /**
   * Handle offer timeout logic
   * @param {Object} param0
   * @param {string} param0.orderId
   * @param {number} param0.driverIndex
   * @param {Array} param0.drivers
   */
  static async handleOfferTimeout({ orderId, driverId }) {
    console.log('Timeout. No Response From Driver'); // We need this log for testing purpose

    const offer = await getOffer(orderId, driverId);
    if (!offer) {
      await increaseDriverIndex(orderId);
      return await OfferService.sendOfferToDriver(orderId);
    }

    switch (offer.status) {
      case OFFER_STATUS.PENDING:
        //TODO: In future we need to take care of race condition if we have more than one process.
        offer.status = OFFER_STATUS.EXPIRED;
        await offer.save();
        await increaseDriverIndex(orderId);
        await OfferService.sendOfferToDriver(orderId);
        const driver = await fetchDriverByDriverId(driverId);
        if (!driver) return;
        await DbJobService.scheduleCalculateAcceptanceRate(driver.user._id);
        break;

      // In here, if the order is rejected, so it means, the rejectOffer function in offer service layer already sent the offer to next driver
      case OFFER_STATUS.REJECTED:
      case OFFER_STATUS.ACCEPTED:
        console.log(`Offer already accepted/rejected by driver ${driverId}`);
        break;
    }
  }
}
