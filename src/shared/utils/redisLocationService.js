import redisClient from '#config/redis.js';

export class RedisService {
  /**
   * Save Data In Redis
   * @param {string} key
   * @param {object} data
   */
  static async saveDataToRedis(key, data) {
    if (!data || Object.values(data).length === 0) return;

    const REDIS_DATA_EXPIRATION_TIME =
      Number(process.env.REDIS_DATA_EXPIRATION_HOURS || 2) * 60 * 60;

    await redisClient.hSet(key, data);

    // Set Expiration Time For Redis Data
    await redisClient.expire(key, REDIS_DATA_EXPIRATION_TIME);
  }

  /**
   * Get Data From Redis
   * @param {string} key
   * @returns
   */
  static getRedisData(key) {
    return redisClient.hGetAll(key);
  }

  /**
   * Remove Data From Redis
   * @param {string} key
   */
  static removeRedisData(key) {
    return redisClient.del(key);
  }

  /**
   * Set a key only if it does not already exist.
   * @param {string} key
   * @param {string} value
   * @returns {Promise<boolean>}
   */
  static async setIfNotExists(key, value = '1') {
    const result = await redisClient.set(key, value, {
      NX: true,
    });

    return result === 'OK';
  }
}
