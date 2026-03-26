import express from 'express';
import {
  addBusiness,
  getBusiness,
  getBusinesses,
  modifyBusiness,
} from '../../controllers/v1/business.controller.js';
import { adminCreateBusinessValidator } from '../../dto/admin-create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { adminUpdateBusinessValidator } from '../../dto/admin-update-business-schema.js';

const router = express.Router();

router
  .route('/')
  .post(validate(adminCreateBusinessValidator), asyncHandler(addBusiness))
  .get(asyncHandler(getBusinesses));

router
  .route('/:id')
  .get(validate(mongoIdValidator), asyncHandler(getBusiness))
  .put(
    validate(mongoIdValidator),
    validate(adminUpdateBusinessValidator),
    asyncHandler(modifyBusiness)
  );

export default router;
