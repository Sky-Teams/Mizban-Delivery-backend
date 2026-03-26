import {
  createBusinessCustomer,
  getBusinessCustomers,
  updateBusinessCustomer,
} from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import { createBusinessCustomerValidator } from '#modules/businessCustomers/dto/create.businessCustomer.schema.js';
import { updateBusinessCustomerValidator } from '#modules/businessCustomers/dto/update.businessCustomer.schema.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { queriesValidator } from '#shared/middleware/queryValidator.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router
  .route('/')
  .post(validate(createBusinessCustomerValidator), asyncHandler(createBusinessCustomer))
  .get(validate(queriesValidator), asyncHandler(getBusinessCustomers));

router
  .route('/:id')
  .patch(
    validate(mongoIdValidator),
    validate(updateBusinessCustomerValidator),
    asyncHandler(updateBusinessCustomer)
  );
export default router;
