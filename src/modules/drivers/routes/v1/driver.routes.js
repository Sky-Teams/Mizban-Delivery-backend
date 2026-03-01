import express from 'express';
import { createDriver } from '../../controllers/v1/driver.controller.js';
import { createDriverValidator } from '../../dto/create-driver.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';

const router = express.Router();

router.post('/', validate(createDriverValidator), asyncHandler(createDriver));

export default router;
