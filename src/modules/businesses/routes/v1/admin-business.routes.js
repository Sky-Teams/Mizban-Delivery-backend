import {
  getBusiness,
  getBusinesses,
} from '#modules/businesses/controllers/v1/business.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router.route('/').get(asyncHandler(getBusinesses));

router.get('/:id', validate(mongoIdValidator), asyncHandler(getBusiness));

export default router;
