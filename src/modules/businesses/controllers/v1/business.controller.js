import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import { isOwner, updateBusinessService } from '../../services/v1/business.service.js';

export const updateBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const isUserOwner = await isOwner(req.user._id, req.params.id);
  if (!isUserOwner)
    throw new AppError('You donot have permission to update', 403, ERROR_CODES.FORBIDDEN);

  const businessData = await updateBusinessService(req.user._id, req.params.id, req.body);

  res.status(200).json({ success: true, data: businessData });
};
