import express from 'express';
import {
  createDriver,
  getDriverProfile,
  updateDriver,
} from '../../controllers/v1/driver.controller.js';
import { createDriverValidator } from '../../dto/create-driver.schema.js';
import { updateDriverValidator } from '../../dto/update-driver.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';

const router = express.Router();

router.post('/', validate(createDriverValidator), asyncHandler(createDriver));
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(updateDriverValidator),
  asyncHandler(updateDriver)
);
router.get('/me', asyncHandler(getDriverProfile)); // Driver can get its own info from this route.
export default router;
