import { notFound } from '#shared/errors/error.js';
import { UserModel } from '../../models/user.model.js';

export const getUserProfile = async (userId) => {
  const profile = await UserModel.findById(userId);
  if (!profile) throw notFound('User');

  return {
    _id: profile._id,
    name: profile.name,
    email: profile.email,
    phone: profile?.phone,
  };
};

export const addDevice = async (userId, fcmToken, platform, deviceId) => {
  const updatedUser = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      'devices.deviceId': deviceId,
    },
    {
      $set: {
        'devices.$.fcmToken': fcmToken,
        'devices.$.platform': platform,
      },
    },
    { new: true }
  );

  if (updatedUser) return updatedUser;

  return await UserModel.findByIdAndUpdate(
    userId,
    {
      $push: {
        devices: { platform, fcmToken, deviceId },
      },
    },
    { new: true }
  );
};

export const updateDeviceInfo = async (userId, fcmToken, platform, deviceId) => {
  const updateFields = {};

  if (fcmToken) {
    updateFields['devices.$.fcmToken'] = fcmToken;
  }

  if (platform) {
    updateFields['devices.$.platform'] = platform;
  }

  const updatedUser = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      'devices.deviceId': deviceId,
    },
    {
      $set: updateFields,
    },
    { new: true }
  );

  if (!updatedUser) throw notFound('Device');

  return updatedUser;
};
