import { unauthorized } from '#shared/errors/error.js';
import { getUserProfile } from '../../services/v1/user.service.js';
import { UserModel } from '#modules/users/models/user.model.js';

export const getProfile = async (req, res) => {
  if (!req.user) throw unauthorized();

  const profile = await getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: profile,
  });
};

export const saveFcmToken = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      message: "FCM token is required",
    });
  }

  await UserModel.findByIdAndUpdate(req.user._id, {
    fcmToken,
  });

  res.status(200).json({
    success: true,
    message: "FCM token saved successfully", // if possible let me know how do you translate the messages shown to users
  });
};