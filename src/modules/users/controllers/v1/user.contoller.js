import { unauthorized } from '#shared/errors/error.js';
import { getUserProfile } from '../../services/v1/user.service.js';

export const getProfile = async (req, res) => {
  if (!req.user) throw unauthorized();

  const profile = await getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: profile,
  });
};
