import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from '#modules/users/index.js';
import { getUserProfile } from '#modules/users/index.js';
import { addDevice, updateDeviceInfo } from '#modules/users/services/v1/user.service.js';

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('getUserProfile', () => {
    it('Should return user info', async () => {
      const mockData = {
        _id: 'user1',
        name: 'driver',
        email: 'driver@example.com',
        phone: '0789123456',
      };
      UserModel.findById.mockResolvedValue(mockData);

      const result = await getUserProfile('user1');

      expect(result).toEqual(mockData);
      expect(UserModel.findById).toHaveBeenCalledWith('user1');
    });

    it('Should return an error is user not found', async () => {
      UserModel.findById.mockResolvedValue(null);

      await expect(getUserProfile('user1')).rejects.toThrow();
    });
  });
});

describe('addDevice service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update existing device if found', async () => {
    const mockUser = { _id: 'user-1', devices: [] };

    UserModel.findOneAndUpdate.mockResolvedValue(mockUser);

    const result = await addDevice('user-1', 'token-123', 'ios', 'device-1');

    expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
    expect(UserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should add new device if not exists', async () => {
    UserModel.findOneAndUpdate.mockResolvedValue(null);

    const mockUpdatedUser = {
      _id: 'user-1',
      devices: [{ deviceId: 'device-1' }],
    };

    UserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

    const result = await addDevice('user-1', 'token-123', 'ios', 'device-1');

    expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockUpdatedUser);
  });
});

describe('updateDeviceInfo service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update device with both fcmToken and platform', async () => {
    const mockUser = { _id: 'user-1', devices: [{ deviceId: 'device-1' }] };

    UserModel.findOneAndUpdate.mockResolvedValue(mockUser);

    const result = await updateDeviceInfo('user-1', 'token-123', 'ios', 'device-1');

    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'user-1',
        'devices.deviceId': 'device-1',
      },
      {
        $set: {
          'devices.$.fcmToken': 'token-123',
          'devices.$.platform': 'ios',
        },
      },
      { new: true }
    );

    expect(result).toEqual(mockUser);
  });

  it('should update only fcmToken if platform not provided', async () => {
    const mockUser = { _id: 'user-1' };

    UserModel.findOneAndUpdate.mockResolvedValue(mockUser);

    await updateDeviceInfo('user-1', 'token-123', null, 'device-1');

    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'user-1',
        'devices.deviceId': 'device-1',
      },
      {
        $set: {
          'devices.$.fcmToken': 'token-123',
        },
      },
      { new: true }
    );
  });

  it('should update only platform if fcmToken not provided', async () => {
    const mockUser = { _id: 'user-1' };

    UserModel.findOneAndUpdate.mockResolvedValue(mockUser);

    await updateDeviceInfo('user-1', null, 'android', 'device-1');

    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'user-1',
        'devices.deviceId': 'device-1',
      },
      {
        $set: {
          'devices.$.platform': 'android',
        },
      },
      { new: true }
    );
  });

  it('should throw error if device not found', async () => {
    UserModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(updateDeviceInfo('user-1', 'token-123', 'ios', 'device-1')).rejects.toThrow();
  });
});
