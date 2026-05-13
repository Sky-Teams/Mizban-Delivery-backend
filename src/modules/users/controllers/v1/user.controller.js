import { unauthorized } from '#shared/errors/error.js';
import { addDevice, getUserProfile, updateDeviceInfo } from '../../services/v1/user.service.js';

export const getProfile = async (req, res) => {
  if (!req.user) throw unauthorized();

  const profile = await getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: profile,
  });
};

export const registerDevice = async (req, res) => {
  if (!req.user) throw unauthorized();

  await addDevice(req.user._id, req.body.fcmToken, req.body.platform, req.body.deviceId);

  res.status(200).json({ success: true, message: 'Device registered successfully' });
};

export const updateDevice = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { deviceId } = req.params;

  await updateDeviceInfo(req.user._id, req.body.fcmToken, req.body.platform, deviceId);

  res.status(200).json({
    success: true,
    message: 'Device info updated successfully',
  });
};
