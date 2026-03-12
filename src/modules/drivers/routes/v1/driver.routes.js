import express from 'express';
import {
  addDriver,
  getAllDrivers,
  getDriver,
  modifyDriver,
} from '../../controllers/v1/driver.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { createDriverValidator } from '../../dto/create-driver.schema.js';
import { updateDriverValidator } from '../../dto/update-driver.schema.js';

const router = express.Router();

router.post('/', validate(createDriverValidator), asyncHandler(addDriver));
router.get('/', asyncHandler(getAllDrivers));
router.get('/:id', validate(mongoIdValidator), asyncHandler(getDriver)); // route /:id => id is driverId
router.put(
  '/:id', // route /:id => id is driverId
  validate(mongoIdValidator),
  validate(updateDriverValidator),
  asyncHandler(modifyDriver)
);

export default router;
