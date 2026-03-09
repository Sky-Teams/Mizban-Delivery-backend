import {
  assignDriver,
  cancelOrder,
  createDelivery,
  deliverOrder,
  pickupOrder,
  updateDeliveryRequest,
} from '../../controllers/v1/deliveryRequest.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import express from 'express';
import { validate } from '#shared/middleware/validate.js';
import { adminCreateDeliveryRequestValidator } from '../../dto/admin-create-delivery-request.schema.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { adminUpdateDeliveryRequestValidator } from '../../dto/admin-update-delivery-request.schema.js';
import {
  assignDriverValidator,
  cancelDeliveryValidator,
} from '../../dto/delivery-request-actions.schema.js';

const router = express.Router();

router.post('/', validate(adminCreateDeliveryRequestValidator), asyncHandler(createDelivery));
router.patch(
  '/:id/assign',
  validate(mongoIdValidator),
  validate(assignDriverValidator),
  asyncHandler(assignDriver)
);
router.patch('/:id/pickup', validate(mongoIdValidator), asyncHandler(pickupOrder));
router.patch('/:id/deliver', validate(mongoIdValidator), asyncHandler(deliverOrder));
router.patch(
  '/:id/cancel',
  validate(mongoIdValidator),
  validate(cancelDeliveryValidator),
  asyncHandler(cancelOrder)
);
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(adminUpdateDeliveryRequestValidator),
  asyncHandler(updateDeliveryRequest)
);

export default router;
