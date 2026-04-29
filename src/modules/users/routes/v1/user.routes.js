import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { getProfile } from '../../controllers/v1/user.contoller.js';
import { saveFcmToken } from '../../controllers/v1/user.contoller.js';
import { authMiddleware } from '#shared/middleware/authMiddleware.js';

const router = express.Router();

router.get('/', asyncHandler(getProfile));
router.post('/save-fcm-token', authMiddleware, asyncHandler(saveFcmToken)); // created new route for posting fcmToken

export default router;
