import { acceptOffer, rejectOffer } from '#modules/offers/controllers/v1/offer.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import express from 'express';
const router = express.Router();

router.post('/:id/accept', authorizeRole('driver'), asyncHandler(acceptOffer));
router.post('/:id/reject', authorizeRole('driver'), asyncHandler(rejectOffer));

export default router;
