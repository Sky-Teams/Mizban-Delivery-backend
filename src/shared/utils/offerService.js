import { agenda } from '#config/agenda.js';
import { fetchDriverByDriverId } from '#modules/drivers/index.js';
import { createOffer, getOffer } from '#modules/offers/index.js';
import { getOrderById, increaseDriverIndex } from '#modules/orders/index.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService..js';

export class OfferService {
  /**
   * Send offer to a specific driver
   * @param {string} orderId
   */
  static async sendOfferToDriver(orderId) {
    try {
      const order = await getOrderById(orderId);

      // console.log('Attempting to send offer for order: ', orderId);

      // Check if order is still available
      // ex: Driver accept the offer on last seconds and timeout job is executed.
      if (order.status !== 'created') return; // It means order is not in created mode, so we cancel the process

      const driversIds = order.recommendedDrivers;
      const currentIndex = order.currentDriverIndex;

      console.log('DriverIds: ', driversIds);
      console.log('currentIndex: ', currentIndex);

      if (currentIndex >= driversIds.length) {
        console.log('No Driver found');
        // TODO we must search what should we do if no driver found. for now we just send an notification for all admins
        const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
        await NotificationService.send('admins', 'no-driver', noDriverFoundPayload);
        return;
      }

      console.log('Send offer to driver: ', driversIds[currentIndex]);

      const offer = await createOffer(orderId, driversIds[currentIndex]);

      if (!offer) {
        await increaseDriverIndex(orderId);
        return await OfferService.sendOfferToDriver(orderId);
      }

      //TODO: Does we need to check if driver is still available? Yes because maybe driver accept another offer during this offer.
      //TODO: We should check if its on the same way of offer
      const driver = await fetchDriverByDriverId(driversIds[currentIndex]);
      if (!driver || driver.status !== 'idle' || driver.activeOrders >= driver.maxOrders) {
        await increaseDriverIndex(orderId);
        return await OfferService.sendOfferToDriver(orderId);
      }
      const offerPayload = NotificationPayloads.orderOffered();
      await NotificationService.send('driver', 'offer', offerPayload, driver.user.toString());

      console.log('Offer Id: ', offer._id);

      // Schedule timeout job. For simulating the process, timeout is set to 30s
      await agenda.schedule('35s', 'offer:timeout', {
        orderId,
        driverId: offer.driver,
        offerId: offer._id,
      });
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
      await NotificationService.send('admin', 'system-error', systemErrorPayload);

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
    // console.log(`Timeout, sending offer to new driver: ${drivers[driverIndex]._id}`);
    // const order = await getOrderById(orderId);

    // const driverIds = order.recommendedDrivers;
    // const currentIndex = order.currentDriverIndex;

    // const driver = drivers[driverIndex];
    console.log('Timeout');

    const offer = await getOffer(orderId, driverId);
    if (!offer) {
      await increaseDriverIndex(orderId);
      return await OfferService.sendOfferToDriver(orderId);
    }

    switch (offer.status) {
      case 'pending':
        //TODO: In future we need to take care of race condition if we have more than one process.
        offer.status = 'expired';
        await offer.save();
        await increaseDriverIndex(orderId);
        await OfferService.sendOfferToDriver(orderId);
        break;

      //TODO: In here, if the order is rejected, so it means, the rejectOffer function already sent the offer to next driver
      case 'rejected':
        // await OfferService.sendOfferToDriver(orderId, drivers, driverIndex + 1);
        break;

      case 'accepted':
        console.log(`Offer already accepted by driver ${driverId}`);
        break;
    }
  }
}
