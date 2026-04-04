import { agenda } from '#config/agenda.js';
import { createOrderOffer, getOrderOffer } from '#modules/orderOffers/index.js';
import { CustomSocket } from '#config/socket.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';

export class OfferService {
  /**
   * Send offer to a specific driver
   * @param {string} orderId
   * @param {Array} drivers
   * @param {number} driverIndex
   */
  static async sendOfferToDriver(orderId, drivers, driverIndex) {
    if (driverIndex >= drivers.length) {
      const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
      CustomSocket.emitToAdmins('no-driver', noDriverFoundPayload);
      return;
    }

    const driver = drivers[driverIndex];
    await createOrderOffer(orderId, driver._id.toString());

    const offerPayload = NotificationPayloads.orderOffered();
    CustomSocket.emitToUser(driver.user.toString(), 'offer', offerPayload);

    // Schedule timeout job. For simulating the process, timeout is set to 4s
    await agenda.schedule('4s', 'offer:timeout', {
      orderId,
      driverIndex,
      drivers,
    });
  }

  /**
   * Handle offer timeout logic
   * @param {Object} param0
   * @param {string} param0.orderId
   * @param {number} param0.driverIndex
   * @param {Array} param0.drivers
   */
  static async handleOfferTimeout({ orderId, driverIndex, drivers }) {
    console.log('Timeout, sending offer to new driver');
    const driver = drivers[driverIndex];

    const offer = await getOrderOffer(orderId, driver._id.toString());
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
