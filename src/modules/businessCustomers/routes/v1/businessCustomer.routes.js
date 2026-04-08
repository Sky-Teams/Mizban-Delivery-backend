import {
  createBusinessCustomer,
  getBusinessCustomers,
  updateBusinessCustomer,
} from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { updateBusinessCustomerValidator } from '#modules/businessCustomers/dto/update.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';
import { businessCustomerQueryValidator } from '#modules/businessCustomers/dto/businessCustomer-query-validator.js';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer))
  .get(validate(businessCustomerQueryValidator), asyncHandler(getBusinessCustomers));

router
  .route('/:id')
  .patch(
    validate(mongoIdValidator),
    validate(updateBusinessCustomerValidator),
    asyncHandler(updateBusinessCustomer)
  );
export default router;
