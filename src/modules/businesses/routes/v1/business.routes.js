import express from 'express';
import { createBusiness, updateBusiness } from '../../controllers/v1/business.controller.js';
import { createBusinessValidator } from '../../dto/create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { updateBusinessValidator } from '#modules/businesses/dto/update-business.schema.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';

const router = express.Router();

router.post('/', validate(createBusinessValidator), asyncHandler(createBusiness));
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(updateBusinessValidator),
  asyncHandler(updateBusiness)
);

export default router;
