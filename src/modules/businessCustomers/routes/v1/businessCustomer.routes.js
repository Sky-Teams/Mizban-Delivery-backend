import {
  createBusinessCustomer,
  updateBusinessCustomer,
} from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { updateBusinessCustomerValidator } from '#modules/businessCustomers/dto/update.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer));

router
  .route('/:id')
  .patch(validate(updateBusinessCustomerValidator), asyncHandler(updateBusinessCustomer));

export default router;
