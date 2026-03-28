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
