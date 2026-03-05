import { createBusinessCustomerByAdmin } from '#modules/businessCustomers/controllers/v1/adminBusinessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/business-customers')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomerByAdmin));

export default router;
