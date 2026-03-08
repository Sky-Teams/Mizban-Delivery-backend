import express from 'express';
import { addBusiness } from '../../controllers/v1/business.controller.js';
import { adminCreateBusinessValidator } from '../../dto/admin-create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { updateBusinessValidator } from '../../dto/update-business.schema.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';

const router = express.Router();

router.post('/', validate(adminCreateBusinessValidator), asyncHandler(addBusiness));
// router.put(
//   '/:id',
//   validate(mongoIdValidator),
//   validate(updateBusinessValidator),
//   asyncHandler(updateBusiness)
// );

export default router;
