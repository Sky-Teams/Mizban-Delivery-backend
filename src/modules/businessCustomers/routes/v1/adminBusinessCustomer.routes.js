import {
  createBusinessCustomer,
  getBusinessCustomers,
} from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer))
  .get(asyncHandler(getBusinessCustomers));
export default router;
