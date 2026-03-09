import { unauthorized } from '#shared/errors/error.js';
import {
  updateBusinessService,
  createNewBusiness,
  addNewBusiness,
  modifyExistedBusiness,
} from '../../services/v1/business.service.js';

//region admin
//create
export const addBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const business = await addNewBusiness(req.body);
  res.status(201).json({
    success: true,
    data: business,
  });
};

//update
export const modifyBusiness = async (req, res) => {
  if (!req.user) throw unauthorized();

  const updates = await modifyExistedBusiness(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: updates,
  });
};

//endregion

//region user
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
