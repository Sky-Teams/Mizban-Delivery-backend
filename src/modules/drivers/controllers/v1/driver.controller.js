import { notFound, unauthorized } from '#shared/errors/error.js';
import {
  addNewDriver,
  fetchDriverByDriverId,
  fetchDrivers,
  modifyExistedDriver,
} from '../../services/v1/driver.service.js';

//#region controllers

export const addDriver = async (req, res) => {
  if (!req.user) throw unauthorized();

  const newDriver = await addNewDriver(req.body);

  res.status(201).json({ success: true, data: newDriver });
};

export const modifyDriver = async (req, res) => {
  if (!req.user) throw unauthorized();
  const updatedDriver = await modifyExistedDriver(req.params.id, req.body);
  res.status(200).json({ success: true, data: updatedDriver });
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

  if (!driver) throw notFound('Driver');

  res.status(200).json({ success: true, data: driver });
};

//#endregion

//#region User Routes => We will need these controllers in future. For now we don't need them

// User can request to create a driver account
// export const createDriver = async (req, res) => {
//   if (!req.user) throw unauthorized();

//   const exist = await doesDriverExist(req.user._id);
//   if (exist) throw new AppError('Driver already exist', 400, ERROR_CODES.DRIVER_ALREADY_EXIST);

//   const driver = await createNewDriver(req.user._id, req.body);
//   res.status(201).json({ success: true, data: driver });
// };

// User can update its driver account
// export const updateDriver = async (req, res) => {
//   if (!req.user) throw unauthorized();

//   const updatedDriver = await updateExistedDriver(req.params.id, req.user._id, req.body);
//   res.status(200).json({ success: true, data: updatedDriver });
// };

// Return driver info by userId
// export const getDriverProfile = async (req, res) => {
//   if (!req.user) throw unauthorized();

//   const driverInfo = await getDriverInfoByUserId(req.user._id);
//   if (!driverInfo) throw notFound('Driver');

//   res.status(200).json({ success: true, data: driverInfo });
// };

//#endregion
