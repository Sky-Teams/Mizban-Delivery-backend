import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationService } from '#shared/utils/locationService.js';
import { CustomSocket } from '#config/socket.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { getDriverOrdersByStatus } from '#modules/orders/index.js';
import { startLocationSync, stopLocationSync } from '../../../jobs/locationSync.js';
import { DtoService } from '#shared/utils/dtoService.js';
import { handleLocationError } from '#shared/utils/handleLocationError.js';
import { RedisService } from '#shared/utils/redisLocationService.js';

vi.mock('#modules/drivers/services/v1/driver.service.js', () => ({
  fetchDriverByUserId: vi.fn(),
}));

vi.mock('#modules/locations/services/v1/location.service.js', () => ({
  updateDriverLocation: vi.fn(),
}));

vi.mock('#modules/orders/services/v1/order.service.js', () => ({
  getDriverOrdersByStatus: vi.fn(),
}));

vi.mock('#shared/utils/redisLocationService.js', () => ({
  RedisService: {
    saveDataToRedis: vi.fn(),
    getRedisData: vi.fn(),
    removeRedisData: vi.fn(),
  },
}));

vi.mock('#shared/utils/dtoService.js', () => ({
  DtoService: {
    formatDriver: vi.fn(),
    order: vi.fn(),
  },
}));

vi.mock('#config/socket.js', () => ({
  CustomSocket: {
    sendLiveLocationToAdmins: vi.fn(),
    emitToOnlineUser: vi.fn(),
  },
}));

vi.mock('../../../jobs/locationSync.js', () => ({
  startLocationSync: vi.fn(),
  stopLocationSync: vi.fn(),
}));

const { publishMock } = vi.hoisted(() => ({
  publishMock: vi.fn(),
}));

vi.mock('#shared/events/RedisEventPublisher.js', () => ({
  RedisEventPublisher: vi.fn(function () {
    return {
      publish: publishMock,
    };
  }),
}));

vi.mock('#shared/utils/handleLocationError.js', () => ({
  handleLocationError: vi.fn(),
}));

describe('LocationService', () => {
  const driver = {
    _id: 'driver-123',
    user: 'user-123',
  };

  const order = {
    _id: 'order-123',
    source: 'mizban',
  };

  const driverDetails = {
    _id: 'driver-123',
    type: 'food',
  };

  const orderDetails = {
    _id: 'order-123',
    sourceOrderId: 'mizban-order-123',
  };

  const location = {
    lat: '34.5553',
    lng: '69.2075',
    updatedAt: '2026-09-28T08:00:00.000Z',
  };

  publishMock.mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateLocation', () => {
    it('should update driver location successfully', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue([order]);

      RedisService.saveDataToRedis.mockResolvedValue(undefined);

      RedisService.getRedisData.mockResolvedValue(location);

      DtoService.formatDriver.mockResolvedValue(driverDetails);

      DtoService.order.mockResolvedValue(orderDetails);

      publishMock.mockResolvedValue(undefined);

      await LocationService.updateLocation('user-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553, 69.2075],
        },
      });

      expect(fetchDriverByUserId).toHaveBeenCalledWith('user-123');

      expect(getDriverOrdersByStatus).toHaveBeenCalledWith('driver-123', expect.anything());

      expect(RedisService.saveDataToRedis).toHaveBeenCalledWith(
        expect.stringContaining('driver-123'),
        expect.objectContaining({
          lat: '34.5553',
          lng: '69.2075',
          updatedAt: expect.any(String),
        })
      );

      publishMock.mockResolvedValue(undefined);

      expect(CustomSocket.sendLiveLocationToAdmins).toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          orders: [orderDetails],

          driverDetails: expect.objectContaining({
            _id: 'driver-123',

            currentLocation: {
              type: 'Point',
              coordinates: [34.5553, 69.2075],
            },
          }),
        })
      );
    });

    it('should handle driver not found', async () => {
      fetchDriverByUserId.mockResolvedValue(null);

      await LocationService.updateLocation('user-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553, 69.2075],
        },
      });

      expect(fetchDriverByUserId).toHaveBeenCalledWith('user-123');

      expect(handleLocationError).toHaveBeenCalled();
    });

    it('should handle invalid location data', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue([order]);

      await LocationService.updateLocation('user-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553],
        },
      });

      expect(RedisService.saveDataToRedis).not.toHaveBeenCalled();

      expect(handleLocationError).toHaveBeenCalled();
    });

    it('should not publish location event for non mizban orders', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue([
        {
          ...order,
          source: 'other-service',
        },
      ]);

      RedisService.saveDataToRedis.mockResolvedValue(undefined);

      RedisService.getRedisData.mockResolvedValue(location);

      DtoService.formatDriver.mockResolvedValue(driverDetails);

      DtoService.order.mockResolvedValue(orderDetails);

      await LocationService.updateLocation('user-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553, 69.2075],
        },
      });

      expect(publishMock).not.toHaveBeenCalled();
      expect(CustomSocket.sendLiveLocationToAdmins).toHaveBeenCalled();
    });

    it('should continue successfully when publishing event fails', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue([order]);

      RedisService.saveDataToRedis.mockResolvedValue(undefined);

      RedisService.getRedisData.mockResolvedValue(location);

      DtoService.formatDriver.mockResolvedValue(driverDetails);

      DtoService.order.mockResolvedValue(orderDetails);

      await LocationService.updateLocation('user-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553, 69.2075],
        },
      });

      expect(publishMock).toHaveBeenCalled();

      expect(CustomSocket.sendLiveLocationToAdmins).toHaveBeenCalled();

      expect(handleLocationError).not.toHaveBeenCalled();
    });
  });

  describe('startDriverTracking', () => {
    it('should start driver tracking successfully', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue([order]);

      startLocationSync.mockResolvedValue(undefined);

      const result = await LocationService.startDriverTracking('user-123');

      expect(fetchDriverByUserId).toHaveBeenCalledWith('user-123');

      expect(getDriverOrdersByStatus).toHaveBeenCalledWith('driver-123', expect.anything());

      expect(startLocationSync).toHaveBeenCalledWith('driver-123');

      expect(result).toEqual(driver);
    });

    it('should handle driver not found', async () => {
      fetchDriverByUserId.mockResolvedValue(null);

      await LocationService.startDriverTracking('user-123');

      expect(startLocationSync).not.toHaveBeenCalled();

      expect(handleLocationError).toHaveBeenCalled();
    });

    it('should not start tracking when driver has no pickedUp order', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      getDriverOrdersByStatus.mockResolvedValue(null);

      await LocationService.startDriverTracking('user-123');

      expect(startLocationSync).not.toHaveBeenCalled();

      expect(handleLocationError).toHaveBeenCalled();
    });
  });

  describe('stopDriverTracking', () => {
    it('should save last location, remove Redis data and stop syncing', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      RedisService.getRedisData.mockResolvedValue(location);

      updateDriverLocation.mockResolvedValue(driver);

      RedisService.removeRedisData.mockResolvedValue(undefined);

      stopLocationSync.mockResolvedValue(undefined);

      const result = await LocationService.stopDriverTracking('user-123');

      expect(fetchDriverByUserId).toHaveBeenCalledWith('user-123');

      expect(RedisService.getRedisData).toHaveBeenCalledWith(expect.stringContaining('driver-123'));

      expect(updateDriverLocation).toHaveBeenCalledWith('driver-123', {
        currentLocation: {
          type: 'Point',
          coordinates: [34.5553, 69.2075],
        },
      });

      expect(RedisService.removeRedisData).toHaveBeenCalledWith(
        expect.stringContaining('driver-123')
      );

      expect(stopLocationSync).toHaveBeenCalledWith('driver-123');

      expect(result).toEqual(driver);
    });

    it('should handle driver not found', async () => {
      fetchDriverByUserId.mockResolvedValue(null);

      await LocationService.stopDriverTracking('user-123');

      expect(RedisService.getRedisData).not.toHaveBeenCalled();

      expect(handleLocationError).toHaveBeenCalled();
    });

    it('should return when Redis location does not exist', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      RedisService.getRedisData.mockResolvedValue(null);

      const result = await LocationService.stopDriverTracking('user-123');

      expect(result).toBeUndefined();

      expect(updateDriverLocation).not.toHaveBeenCalled();

      expect(RedisService.removeRedisData).not.toHaveBeenCalled();

      expect(stopLocationSync).not.toHaveBeenCalled();
    });

    it('should return when Redis latitude is invalid', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      RedisService.getRedisData.mockResolvedValue({
        lat: 'invalid',
        lng: '69.2075',
        updatedAt: '2026-09-28T08:00:00.000Z',
      });

      const result = await LocationService.stopDriverTracking('user-123');

      expect(result).toBeUndefined();

      expect(updateDriverLocation).not.toHaveBeenCalled();

      expect(RedisService.removeRedisData).not.toHaveBeenCalled();

      expect(stopLocationSync).not.toHaveBeenCalled();
    });

    it('should return when Redis longitude is invalid', async () => {
      fetchDriverByUserId.mockResolvedValue(driver);

      RedisService.getRedisData.mockResolvedValue({
        lat: '34.5553',
        lng: 'invalid',
        updatedAt: '2026-09-28T08:00:00.000Z',
      });

      const result = await LocationService.stopDriverTracking('user-123');

      expect(result).toBeUndefined();

      expect(updateDriverLocation).not.toHaveBeenCalled();

      expect(RedisService.removeRedisData).not.toHaveBeenCalled();

      expect(stopLocationSync).not.toHaveBeenCalled();
    });
  });
});
