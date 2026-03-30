import { CustomSocket } from '#config/socket.js';
import { findNearestDrivers } from '#modules/drivers/index.js';
import { createOrderOffer } from '#modules/orderOffers/index.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { GeoService } from '#shared/utils/geoService.js';
import { NotificationPayloads } from '#shared/utils/notificationPayloadBuilder.js';
import { DriverScore } from '#shared/utils/scorePrediction.js';
import { createNotificationForAdmins } from '../services/v1/notification.service.js';

export const registerOrderListeners = () => {
  eventBus.on('order:created', async (data) => {
    const orderId = data.orderId;
    const payload = NotificationPayloads.orderCreated(orderId);
    CustomSocket.emitToAdmins('notification', payload);

    await createNotificationForAdmins(payload.type, payload.title, payload.message);

    const pickupLocation = data.newOrder.pickupLocation.coordinates;

    const drivers = await findNearestDrivers(pickupLocation);

    // TODO we must search what should we do if no driver found. for now we just send an notification for all admins

    if (!drivers || drivers.length === 0) {
      const noDriverFoundPayload = NotificationPayloads.noDriverFound(orderId);
      CustomSocket.emitToAdmins('no-driver', noDriverFoundPayload);

      // TODO we should store this notification for all admins

      await createNotificationForAdmins(
        noDriverFoundPayload.type,
        noDriverFoundPayload.title,
        noDriverFoundPayload.message
      );

      return;
    }

    const DriversWithETA = await GeoService.getDistanceMatrix(drivers, pickupLocation);

    // Attach route and calculate score
    const scoredDrivers = DriversWithETA.map(({ driver, distance, eta }) => {
      const score = DriverScore.calculateWithETA(driver, {
        distance,
        time: eta,
      });

      return {
        ...driver,
        distance,
        eta,
        score,
      };
    });

    // Sort Driver based on score
    scoredDrivers.sort((a, b) => b.score - a.score);
    // console.table(scoredDrivers);

    const firstDriver = scoredDrivers[0];
    console.log(firstDriver);

    await createOrderOffer(orderId.toString(), firstDriver._id.toString());

    const offerPayload = NotificationPayloads.orderOffered();

    CustomSocket.emitToUser(firstDriver.user.toString(), 'offer', offerPayload);

    // TODO: Does we need to store the offer notification for nearest drivers and also does we need a route that each driver can check the offer
  });
};
