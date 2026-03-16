import {
  createBusinessCustomer,
  getBusinessCustomers,
} from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { queriesValidator } from '#shared/middleware/queryValidator.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer))
  .get(validate(queriesValidator), asyncHandler(getBusinessCustomers));

export default router;
