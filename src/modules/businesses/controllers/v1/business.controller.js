import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, unauthorized } from '#shared/errors/error.js';
import {
  updateBusinessService,
  createNewBusiness,
  addNewBusiness,
} from '../../services/v1/business.service.js';

//region admin
export const addBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await addNewBusiness(req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};

//endregion

//Create new Business
export const createBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await createNewBusiness(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};

//Update business
export const updateBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const businessData = await updateBusinessService(req.user._id, req.params.id, req.body);

  res.status(200).json({ success: true, data: businessData });
};
