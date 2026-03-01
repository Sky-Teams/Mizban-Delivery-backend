import { createNewBusiness } from '../../services/v1/business.service.js';

export const createBusiness = async (req, res) => {
  const userId = req.user._id;

  const business = await createNewBusiness(userId, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};
