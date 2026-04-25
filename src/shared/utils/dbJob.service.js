import { agenda } from '#config/agenda.js';

export class DbJobService {
  static #offerExpiresIn = process.env.Offer_Expires_In_Seconds || 30;
  /**
   * Create a job in Db to calculate the acceptance rate of a driver
   * @param {string} userId
   * @param {number} time - The job time in seconds
   */
  static async scheduleCalculateAcceptanceRate(userId, time = 5) {
    await agenda.schedule(`${time}s`, 'calculate-acceptance-rate', { userId });
  }

  static async scheduleOfferTimeout(orderId, driverId, offerId) {
    await agenda.schedule(`${this.#offerExpiresIn}s`, 'offer:timeout', {
      orderId,
      driverId,
      offerId,
    });
  }

  /**
   * Cancel offer-timeout job in DB
   * @param {string} name - offerId
   */
  static async cancelOfferTimeout(offerId) {
    await agenda.cancel({ name: 'offer:timeout', 'data.offerId': offerId });
  }
}
