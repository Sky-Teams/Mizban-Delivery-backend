import {
  acceptOffer,
  getAllOffers,
  getOfferById,
  rejectOffer,
} from '#modules/offers/controllers/v1/offer.controller.js';
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

// These 2 routes fetch offers for a driver
router.get('/:id', authorizeRole(ROLES.DRIVER), asyncHandler(getOfferById));
router.get('/', authorizeRole(ROLES.DRIVER), asyncHandler(getAllOffers));

export default router;
