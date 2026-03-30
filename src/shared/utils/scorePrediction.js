export class DriverScore {
  static #distanceWeight = 0.4;
  static #etaWeight = 0.4;
  static #ratingWeight = 0.25;
  static #acceptanceWeight = 0.2;
  static #loadWeight = 0.15;
  static #maxDistance = 5000;
  static #maxETA = 3600; // MAX ETA in seconds  3600sec = 60min

  /**
   * Normalize the value of the distance between (0 - 1)
   * @param {Number} distance - Distance between driver and pickupLocation
   * @returns {Number} Normalized value of distance
   */
  static #normalizeDistance(distance) {
    // Close drivers much better than far ones
    const normalized = Math.min(distance / this.#maxDistance, 1);
    return Math.pow(normalized, 2); // Penalize far drivers
  }

  /**
   * Normalize the value of the time between (0 - 1)
   * @param {Number} time - Time in seconds
   * @returns Normalized value of ETA
   */
  static #normalizeETA(time) {
    const normalized = Math.min(time / this.#maxETA, 1);
    return Math.pow(normalized, 2); // Penalize far drivers
  }

  /**
   * Normalize the value of the rating between (0 - 1)
   * @param {Number} ratingAvg - Rating average of driver
   * @returns Normalized value of rating average
   */
  static #normalizeRating(ratingAvg) {
    return ratingAvg / 5;
  }

  static #bayesianRating(ratingAvg, ratingCount) {
    const C = 3.5; // global average rating
    const m = 20; // minimum votes threshold

    return (ratingCount / (ratingCount + m)) * ratingAvg + (m / (ratingCount + m)) * C;
  }

  static #normalizeLoad(activeOrders) {
    return Math.min(activeOrders / 5, 1);
  }

  /**
   * Calculate the score of a driver based on driver ratingAvg,ratingCount,acceptanceRate and activeOrders
   * using linear calculation
   * @param {Object} driver - Driver Object
   * @param {Number} distance - Distance between driver and destination
   * @returns {Number} Score of a driver
   */
  static #LinearScoreCalculationUsingDistance(driver, distance) {
    const { ratingAvg = 0, ratingCount = 0, acceptanceRate = 0, activeOrders = 0 } = driver;

    const normalizedDistance = this.#normalizeDistance(distance);
    const normalizedLoad = this.#normalizeLoad(activeOrders);

    const adjustedRating = this.#normalizeRating(this.#bayesianRating(ratingAvg, ratingCount));
    const normalizedAcceptance = acceptanceRate;

    const penalities =
      normalizedDistance * this.#distanceWeight +
      (1 - adjustedRating) * this.#ratingWeight +
      (1 - normalizedAcceptance) * this.#acceptanceWeight +
      normalizedLoad * this.#loadWeight;

    // Score must be between (0 - 1)
    const score = Math.max(0, Number((1 - penalities).toFixed(4)));

    return score;
  }

  /**
   * Calculate the score of a driver based on driver ratingAvg,ratingCount,acceptanceRate and activeOrders
   * using ETA(Estimated Time of Arrivale)
   * @param {Object} driver - Driver Object
   * @param {Number} route - route info(ETA and Distance)
   * @returns {Number} Score of a driver
   */
  static #LinearScoreCalculationUsingRoute(driver, route) {
    const { ratingAvg = 0, ratingCount = 0, acceptanceRate = 0, activeOrders = 0 } = driver;

    const normalizedETA = this.#normalizeETA(route.time);
    const normalizedLoad = this.#normalizeLoad(activeOrders);

    const adjustedRating = this.#normalizeRating(this.#bayesianRating(ratingAvg, ratingCount));

    const normalizedAcceptance = acceptanceRate;

    const penalities =
      normalizedETA * this.#etaWeight +
      (1 - adjustedRating) * this.#ratingWeight +
      (1 - normalizedAcceptance) * this.#acceptanceWeight +
      normalizedLoad * this.#loadWeight;

    // Score must be between (0 - 1)
    const score = Math.max(0, Number((1 - penalities).toFixed(4)));

    return score;
  }

  /**
   * Calculate Driver score
   * @param {Object} driver - Driver Object
   * @param {Number} distance - Distance between Driver and pickupLocation
   * @returns {Number} Score of Driver
   */
  static calculateWithDestination(driver, distance) {
    return this.#LinearScoreCalculationUsingDistance(driver, distance);
  }

  static calculateWithETA(driver, route) {
    return this.#LinearScoreCalculationUsingRoute(driver, route);
  }
}
