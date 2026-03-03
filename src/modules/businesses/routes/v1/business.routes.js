import { updateBusinessValidator } from '#modules/businesses/dto/update-business.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { updateBusiness } from '../../controllers/v1/business.controller.js';
import express from 'express';

const router = express.Router();

router.put('/:id', validate(updateBusinessValidator), asyncHandler(updateBusiness));

export default router;
