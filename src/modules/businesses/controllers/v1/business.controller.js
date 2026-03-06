import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound, unauthorized } from '#shared/errors/error.js';
import {
  createNewBusiness,
  DoesBusinessesExist,
  getAllBusinesses,
  getBusinessById,
} from '../../services/v1/business.service.js';

//Create new Business
export const createBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await DoesBusinessesExist(req.user._id, req.body.phone);
  if (exist) throw new AppError('Business already exist', 400, ERROR_CODES.BUSINESS_ALREADY_EXIST);

  const business = await createNewBusiness(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};

// Get All Businesses
export const getBusinesses = async (req, res) => {
  if (!req.user) throw unauthorized();

  const allBusinesses = await getAllBusinesses();

  res.status(200).json({
    success: true,
    data: allBusinesses,
  });
};

// Get Business By ID
export const getBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await getBusinessById(req.params.id);

  if (!business) throw notFound('Business');

  res.status(200).json({
    success: true,
    data: business,
  });
};
