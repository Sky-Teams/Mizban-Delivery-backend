import redisClient from '#config/redis.js';

export class RedisService {
  /**
   * Save Data In Redis
   * @param {string} key
   * @param {object} data
   */
  static async saveDataToRedis(key, data) {
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
  static async getRedisData(key) {
    return redisClient.hGetAll(key);
  }

  /**
   * Remove Data From Redis
   * @param {string} key
   */
  static async removeRedisData(key) {
    redisClient.del(key);
  }
}
