import express from 'express';
import { addBusiness, modifyBusiness } from '../../controllers/v1/business.controller.js';
import { adminCreateBusinessValidator } from '../../dto/admin-create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { adminUpdateBusinessValidator } from '../../dto/admin-update-business-schema.js';

const router = express.Router();

router.post('/', validate(adminCreateBusinessValidator), asyncHandler(addBusiness));
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(adminUpdateBusinessValidator),
  asyncHandler(modifyBusiness)
);

export default router;
