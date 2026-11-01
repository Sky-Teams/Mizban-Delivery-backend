import {
  canAddNewOrder,
  driverActiveBatch,
} from '#modules/deliveryBatch/services/v1/delivery.batch.service.js';
import { fetchDriverByDriverId } from '#modules/drivers/index.js';
import { createOffer } from '#modules/offers/index.js';
import { findOfferById } from '#modules/offers/services/v1/offer.service.js';
import { getOrderById, increaseDriverIndex } from '#modules/orders/index.js';
import { isBatchSizeAvailable } from './batch.helper.js';
import { RedisEventPublisher } from '#shared/events/RedisEventPublisher.js';
import { DbJobService } from './dbJob.service.js';
import { DtoService } from './dtoService.js';
import {
  DRIVER_STATUS,
  OFFER_STATUS,
  ORDER_STATUS,
  REDIS_CHANNEL,
  REDIS_EVENT_TYPE,
  SOCKET_EVENTS,
} from './enums.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService.js';

const offerPublisher = new RedisEventPublisher(REDIS_CHANNEL.ORDER_OFFER_CHANNEL);

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
        // publish event (no driver found)
        await offerPublisher.publish({
          type: REDIS_EVENT_TYPE.NO_DRIVER_ACCEPTED,
          data: {
            orderId: order.sourceOrderId,
          },
        });
        return;
      }

      const driver = await fetchDriverByDriverId(driversInfo[currentIndex].id);
      let activeBatch;
      if (driver) {
        activeBatch = await driverActiveBatch(driver._id);
      }

      let canAddOrderToBatch;
      if (activeBatch) {
        canAddOrderToBatch = await canAddNewOrder(activeBatch, orderId, { throwOnError: false });
      }

      if (
        !driver ||
        driver.status === DRIVER_STATUS.OFFLINE ||
        (activeBatch && !isBatchSizeAvailable(activeBatch)) ||
        (activeBatch && !canAddOrderToBatch)
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
      orderInfo.offer = offer._id;
      orderInfo.expiresIn = Math.ceil((offer.expiredAt.getTime() - Date.now()) / 1000);
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
   * @param {string} param0.driverId
   * @param {string} param0.offerId
   */
  static async handleOfferTimeout({ orderId, driverId, offerId }) {
    console.log('Timeout. No Response From Driver'); // We need this log for testing purpose

    const offer = await findOfferById(offerId);
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

      // In here, if the offer is rejected, so it means, the rejectOffer function in offer service layer already sent the offer to next driver
      case OFFER_STATUS.REJECTED:
      case OFFER_STATUS.ACCEPTED:
        console.log(`Offer already accepted/rejected by driver ${driverId}`);
        break;
    }
  }
}
