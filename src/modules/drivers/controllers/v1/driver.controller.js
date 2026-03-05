import { doesUserExist } from '#modules/users/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound, unauthorized } from '#shared/errors/error.js';
import {
  addNewDriver,
  createNewDriver,
  doesDriverExist,
  fetchDriverByDriverId,
  fetchDrivers,
  getDriverInfoByUserId,
  updateExistedDriver,
} from '../../services/v1/driver.service.js';

//#region Admin controllers

export const addDrvier = async (req, res) => {
  if (!req.user) throw unauthorized();

  const doesEmailExist = await doesUserExist({ email: req.body.email });
  if (doesEmailExist) throw new AppError('Email already exist', 400, ERROR_CODES.DUPLICATE);

  const newDriver = await addNewDriver(req.body);

  res.status(200).json({ success: true, data: newDriver });
};

// Fetch All Drivers
export const getAllDrivers = async (req, res) => {
  if (!req.user) throw unauthorized();

  const limit = Number(req.query.limit) || 8;
  const page = Number(req.query.page) || 1;

  const searchQuery = {
    searchTerm: req.query?.searchTerm, // searchTerm can be name/email/phone
    vehicleType: req.query?.vehicleType,
    status: req.query?.status,
    isVerified: req.query?.isVerified,
  };

  const { drivers, totalDrivers, totalPages } = await fetchDrivers(limit, page, searchQuery);

  res.status(200).json({
    success: true,
    data: drivers,
    totalDrivers,
    totalPages,
  });
};

// Get driver by driverId
export const getDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const driver = await fetchDriverByDriverId(req.params.id);

  res.status(200).json({ success: true, data: driver });
};

//#endregion

//#region User Routes => We will need these controllers in future. For now we dont need them

// User can request to create a driver account
export const createDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const exist = await doesDriverExist(req.user._id);
  if (exist) throw new AppError('Driver already exist', 400, ERROR_CODES.DRIVER_ALREADY_EXIST);

  const driver = await createNewDriver(req.user._id, req.body);
  res.status(201).json({ success: true, data: driver });
};

// User can update its driver account
export const updateDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updatedDriver = await updateExistedDriver(req.params.id, req.user._id, req.body);
  res.status(200).json({ success: true, data: updatedDriver });
};

// Return driver info by userId
export const getDriverProfile = async (req, res) => {
  if (!req.user) throw unauthorized();

  const driverInfo = await getDriverInfoByUserId(req.user._id);
  if (!driverInfo) throw notFound('Driver');

  res.status(200).json({ success: true, data: driverInfo });
};

//#endregion
