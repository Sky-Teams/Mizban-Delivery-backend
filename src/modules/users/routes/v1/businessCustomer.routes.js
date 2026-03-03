import { createBusinessCustomer } from '#modules/users/controllers/v1/businessCutomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/users/dto/create.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer));

export default router;
