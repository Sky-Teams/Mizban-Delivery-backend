import express from 'express';
import { getAllDrivers, getDriver } from '../../controllers/v1/driver.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';

const router = express.Router();

router.get('/', asyncHandler(getAllDrivers));

router.get('/:id', validate(mongoIdValidator), asyncHandler(getDriver)); // route /:id => id is driverId

export default router;
