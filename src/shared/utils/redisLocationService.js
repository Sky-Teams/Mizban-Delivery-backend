import redisClient from '#config/redis.js';

export const driverLocationRedisKey = `driver:location:`;

/** Save Location In Redis */
export const saveLocationInRedis = async (driverId, [lat, lng]) => {
  await redisClient.hSet(`${driverLocationRedisKey}${driverId}`, {
    lat: String(lat),
    lng: String(lng),
    updatedAt: new Date().toISOString(),
  });
};

/** Get Driver Location From Redis */
export const getDriverLocationFromRedis = async (driverId) => {
  const location = await redisClient.hGetAll(`${driverLocationRedisKey}${driverId}`);

  return {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };
};

/** Remove Driver Location From Redis */
export const deleteDriverLocationFromRedis = async (driverId) => {
  await redisClient.del(`${driverLocationRedisKey}${driverId}`);
};
