import {
  assignDriver,
  cancelOrder,
  createOrder,
  deliverOrder,
  getOrder,
  getOrders,
  pickupOrder,
  returnOrder,
  updateOrder,
  ordersStatistics,
} from '../../controllers/v1/order.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import express from 'express';
import { validate } from '#shared/middleware/validate.js';
import { createOrderValidator } from '../../dto/create-order.schema.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { updateOrderValidator } from '../../dto/update-order.schema.js';
import { assignDriverValidator, cancelOrderValidator } from '../../dto/order-actions.schema.js';
import { orderQueryValidator } from '#modules/orders/dto/order-query-validator.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { ROLES } from '#shared/utils/enums.js';
import { orderStatisticsQueryValidator } from '../../dto/order-statistics-query-validator.js';

const router = express.Router();

router.post(
  '/',
  authorizeRole(ROLES.ADMIN),
  validate(createOrderValidator),
  asyncHandler(createOrder)
);
router.patch(
  '/:id/assign',
  authorizeRole(ROLES.ADMIN),
  validate(mongoIdValidator),
  validate(assignDriverValidator),
  asyncHandler(assignDriver)
);
router.patch(
  '/:id/pickup',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(mongoIdValidator),
  asyncHandler(pickupOrder)
);
router.patch(
  '/:id/deliver',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(mongoIdValidator),
  asyncHandler(deliverOrder)
);
router.patch(
  '/:id/cancel',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(mongoIdValidator),
  validate(cancelOrderValidator),
  asyncHandler(cancelOrder)
);
router.patch(
  '/:id/return',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(mongoIdValidator),
  validate(cancelOrderValidator),
  asyncHandler(returnOrder)
);
router.put(
  '/:id',
  authorizeRole(ROLES.ADMIN),
  validate(mongoIdValidator),
  validate(updateOrderValidator),
  asyncHandler(updateOrder)
);
router.get(
  '/',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(orderQueryValidator),
  asyncHandler(getOrders)
);
router.get(
  '/statistics',
  authorizeRole(ROLES.ADMIN, ROLES.DRIVER),
  validate(orderStatisticsQueryValidator),
  asyncHandler(ordersStatistics)
);
router.get('/:id', authorizeRole(ROLES.ADMIN), validate(mongoIdValidator), asyncHandler(getOrder));

export default router;
