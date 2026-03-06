import { unauthorized } from '#shared/errors/error.js';
import { createNewBusiness } from '../../services/v1/business.service.js';

//Create new Business
export const createBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await createNewBusiness(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};
