import express from 'express';
import {
  addDrvier,
  getAllDrivers,
  getDriver,
  modifyDriver,
} from '../../controllers/v1/driver.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { adminCreateDriverValidator } from '../../dto/admin-create-driver.schema.js';
import { adminUpdateDriverValidator } from '../../dto/admin-update-driver.schema.js';

const router = express.Router();

router.post('/', validate(adminCreateDriverValidator), asyncHandler(addDrvier));
router.get('/', asyncHandler(getAllDrivers));
router.get('/:id', validate(mongoIdValidator), asyncHandler(getDriver)); // route /:id => id is driverId
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(adminUpdateDriverValidator),
  asyncHandler(modifyDriver)
); // route /:id => id is driverId

export default router;
