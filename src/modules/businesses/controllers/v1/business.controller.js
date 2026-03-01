import { createNewBusiness } from '../../services/v1/business.service.js';

export const createBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await createNewBusiness(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};
