import {
  assignDriver,
  cancelOrder,
  createOrder,
  deliverOrder,
  getOrder,
  getOrders,
  pickupOrder,
  updateOrder,
} from '../../controllers/v1/order.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import express from 'express';
import { validate } from '#shared/middleware/validate.js';
import { createOrderValidator } from '../../dto/create-order.schema.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { updateOrderValidator } from '../../dto/update-order.schema.js';
import { assignDriverValidator, cancelOrderValidator } from '../../dto/order-actions.schema.js';
import { orderQueryValidator } from '#modules/orders/dto/order-query-validator.js';

const router = express.Router();

router.post('/', validate(createOrderValidator), asyncHandler(createOrder));
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
  validate(cancelOrderValidator),
  asyncHandler(cancelOrder)
);
router.put(
  '/:id',
  validate(mongoIdValidator),
  validate(updateOrderValidator),
  asyncHandler(updateOrder)
);
router.get('/', validate(orderQueryValidator), asyncHandler(getOrders));
router.get('/:id', validate(mongoIdValidator), asyncHandler(getOrder));

export default router;
