import { acceptOffer, rejectOffer } from '#modules/offers/controllers/v1/offer.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { validate } from '#shared/middleware/validate.js';
import { ROLES } from '#shared/utils/enums.js';
import express from 'express';
const router = express.Router();

router.patch(
  '/:id/accept',
  validate(mongoIdValidator),
  authorizeRole(ROLES.DRIVER),
  asyncHandler(acceptOffer)
);
router.patch(
  '/:id/reject',
  validate(mongoIdValidator),
  authorizeRole(ROLES.DRIVER),
  asyncHandler(rejectOffer)
);

export default router;
