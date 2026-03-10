import { notFound, unauthorized } from '#shared/errors/error.js';
import {
  createNewBusiness,
  getAllBusinesses,
  getBusinessById,
} from '../../services/v1/business.service.js';

//Create new Business
export const createBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await createNewBusiness(req.user._id, req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};

// Get All Businesses
export const getBusinesses = async (req, res) => {
  if (!req.user) throw unauthorized();

  const limit = Number(req.query.limit) || 8;
  const page = Number(req.query.page) || 1;

  const searchQuery = {
    searchTerm: req.query.searchTerm,
  };

  const { businesses, totalBusinesses, totalPages } = await getAllBusinesses(
    limit,
    page,
    searchQuery
  );

  res.status(200).json({
    success: true,
    data: businesses,
    totalBusinesses,
    totalPages,
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
