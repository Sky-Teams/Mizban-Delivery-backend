import express from 'express';
import { createBusiness } from '../../controllers/v1/business.controller.js';
import { createBusinessValidator } from '../../dto/create-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';

const router = express.Router();

router.post('/', validate(createBusinessValidator), asyncHandler(createBusiness));

export default router;
