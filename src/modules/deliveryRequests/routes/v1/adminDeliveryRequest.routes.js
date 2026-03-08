import { createDelivery } from '../../controllers/v1/deliveryRequest.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import express from 'express';
import { validate } from '#shared/middleware/validate.js';
import { adminCreateDeliveryRequestValidator } from '#modules/deliveryRequests/dto/admin-create-delivery-request.schema.js';

const router = express.Router();

router.post('/', validate(adminCreateDeliveryRequestValidator), asyncHandler(createDelivery));

export default router;
