import { agenda } from '#config/agenda.js';
import { createOffer, getOffer } from '#modules/offers/index.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService..js';

export class OfferService {
  /**
   * Send offer to a specific driver
   * @param {string} orderId
   * @param {Array} drivers
   * @param {number} driverIndex
   */
  static async sendOfferToDriver(orderId, drivers, driverIndex) {
    if (driverIndex >= drivers.length) {
      // TODO we must search what should we do if no driver found. for now we just send an notification for all admins
      const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
      await NotificationService.send('admins', 'no-driver', noDriverFoundPayload);
      return;
    }

    const driver = drivers[driverIndex];

    try {
      const offer = await createOffer(orderId, driver._id.toString());
      if (!offer) {
        return await OfferService.sendOfferToDriver(orderId, drivers, driverIndex + 1);
      }
      const offerPayload = NotificationPayloads.orderOffered();
      await NotificationService.send('driver', 'offer', offerPayload, driver.user.toString());

      // Schedule timeout job. For simulating the process, timeout is set to 4s
      await agenda.schedule('30s', 'offer:timeout', {
        orderId,
        driverIndex,
        drivers,
        offerId: offer._id,
      });
    } catch (error) {
      // For validation Error, we send offer to next driver without blocking the recommendation service.
      if (error.name === 'ZodError') {
        console.warn(`Validation error for driver ${driver._id}: ${error.message}`);
        // We send offer to next driver
        return await OfferService.sendOfferToDriver(orderId, drivers, driverIndex + 1);
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
  static async handleOfferTimeout({ orderId, driverIndex, drivers }) {
    console.log(`Timeout, sending offer to new driver: ${drivers[driverIndex]._id}`);
    const driver = drivers[driverIndex];

    const offer = await getOffer(orderId, driver._id.toString());
    if (!offer) return;

    switch (offer.status) {
      case 'pending':
        //TODO: In future we need to take care of race condition if we have more than one process.
        offer.status = 'expired';
        await offer.save();
        await OfferService.sendOfferToDriver(orderId, drivers, driverIndex + 1);
        break;

      case 'rejected':
        await OfferService.sendOfferToDriver(orderId, drivers, driverIndex + 1);
        break;

      case 'accepted':
        console.log(`Offer already accepted by driver ${driver._id}`);
        break;
    }
  }
}
