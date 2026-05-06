import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDevice, updateDevice } from '#modules/users/index.js';
import { getUserProfile, getProfile } from '#modules/users/index.js';
import { addDevice, updateDeviceInfo } from '#modules/users/services/v1/user.service.js';
import { notFound } from '#shared/errors/error.js';

vi.mock('#modules/users/services/v1/user.service.js', () => ({
  getUserProfile: vi.fn(),
  addDevice: vi.fn(),
  updateDeviceInfo: vi.fn(),
}));

describe('User Contoller', () => {
  let req, res;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user1' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });
  describe('getProfile', () => {
    it('Should return user info', async () => {
      const mockData = {
        _id: 'user1',
        name: 'driver',
        email: 'driver@example.com',
        phone: '0789123456',
      };
      getUserProfile.mockResolvedValue(mockData);

      getProfile(req, res);
      const result = await getUserProfile('user1');

      expect(result).toEqual(mockData);
      expect(getUserProfile).toHaveBeenCalledWith('user1');
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(getProfile(req, res)).rejects.toThrow();
    });
  });
});

describe('Device controller - registerDevice', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user-1' },
      body: {
        fcmToken: 'fcm-token-123',
        platform: 'android',
        deviceId: 'device-1',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw error if user is not authenticated', async () => {
    req.user = null;

    await expect(registerDevice(req, res)).rejects.toThrow();

    expect(addDevice).not.toHaveBeenCalled();
  });

  it('should register device successfully', async () => {
    addDevice.mockResolvedValue();

    await registerDevice(req, res);

    expect(addDevice).toHaveBeenCalledWith('user-1', 'fcm-token-123', 'android', 'device-1');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Device registered successfully',
    });
  });
});

describe('Device controller - updateDevice', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user-1' },
      params: {
        deviceId: 'device-2',
      },
      body: {
        fcmToken: 'updated-token',
        platform: 'ios',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should update device successfully', async () => {
    updateDeviceInfo.mockResolvedValue({});

    await updateDevice(req, res);

    expect(updateDeviceInfo).toHaveBeenCalledWith('user-1', 'updated-token', 'ios', 'device-2');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Device info updated successfully',
    });
  });

  it('should throw error if user is not authenticated', async () => {
    req.user = null;

    await expect(updateDevice(req, res)).rejects.toThrow();

    expect(updateDeviceInfo).not.toHaveBeenCalled();
  });

  it('should throw error if device not found', async () => {
    updateDeviceInfo.mockRejectedValue(notFound('Device'));

    await expect(updateDevice(req, res)).rejects.toThrow();

    expect(updateDeviceInfo).toHaveBeenCalledWith('user-1', 'updated-token', 'ios', 'device-2');
  });
});
