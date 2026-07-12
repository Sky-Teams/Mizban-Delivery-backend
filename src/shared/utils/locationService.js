import { updateDriverLocation } from '#modules/locations/index.js';

export class LocationService {
  /**
   * Update driver's current location.
   * @param {string} userId
   * @param {object} data
   */
  static async updateLocation(userId, data) {
    /** TODO: Implement Redis caching in future */

    let driver = await updateDriverLocation(userId, data);

    /** TODO: Emit LOCATION_UPDATED event */

    return driver;
  }
}
