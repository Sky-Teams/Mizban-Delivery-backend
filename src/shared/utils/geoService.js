import axios from 'axios';

/**
 * A centralized service for routes
 */
export class GeoService {
  static #GEO_APIFY_KEY = process.env.GEOAPIFY_KEY;
  static #GEO_APIFY_URL = process.env.GEOAPIFY_URL;

  /**
   * Call Geoapify Distance Matrix API
   * @param {Array} drivers - list of driver objects
   * @param {Array} destination - Coordinates of destination [lng, lat]
   * @returns {Array}
   */
  static async #getDistanceFromGeoapify(drivers, destination) {
    try {
      const url = `${this.#GEO_APIFY_URL}routematrix?apiKey=${this.#GEO_APIFY_KEY}`;

      const body = {
        mode: 'drive', // Type of the vehicle
        traffic: 'approximated', // Traffic-aware
        type: 'balanced', // balance route calculation
        units: 'metric',
        max_speed: 20,
        sources: drivers.map((driver) => ({
          location: [driver.currentLocation.coordinates[1], driver.currentLocation.coordinates[0]],
        })),
        targets: [
          {
            location: [destination[1], destination[0]],
          },
        ],
      };

      const res = await axios.post(url, body, { timeout: 10000 });

      const driversDetails = drivers.map((driver, i) => {
        const route = res.data.sources_to_targets[i]?.[0];

        return {
          driver,
          distance: route?.distance ?? 999999,
          eta: route?.time ?? 999999,
        };
      });

      return driversDetails;
    } catch (error) {
      console.error('Geoapify Distance Matrix error:', error.message);

      return drivers.map((driver) => ({
        driver,
        distance: 999999,
        eta: 999999,
      }));
    }
  }

  /**
   * Get distance + ETA for drivers to a pickup location
   * @param {Array} drivers - Array of drivers
   * @param {Array} destination - Coordinates of destination [lag,lat]
   * @returns {Array} [{ drivers, distance, eta }]
   */
  static async getDistanceMatrix(drivers, destination) {
    if (!drivers?.length) return [];

    return await this.#getDistanceFromGeoapify(drivers, destination);
  }
}
