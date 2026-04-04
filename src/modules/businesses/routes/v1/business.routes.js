import express from 'express';
import {
  addBusiness,
  getBusiness,
  getBusinesses,
  modifyBusiness,
} from '../../controllers/v1/business.controller.js';
import { createBusinessValidator } from '../../dto/create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { updateBusinessValidator } from '../../dto/update-business-schema.js';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessValidator), asyncHandler(addBusiness))
  .get(asyncHandler(getBusinesses));

router
  .route('/:id')
  .get(validate(mongoIdValidator), asyncHandler(getBusiness))
  .put(validate(mongoIdValidator), validate(updateBusinessValidator), asyncHandler(modifyBusiness));

export default router;
