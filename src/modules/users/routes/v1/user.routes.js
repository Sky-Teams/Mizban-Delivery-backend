import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { getProfile } from '../../controllers/v1/user.contoller.js';

const router = express.Router();

router.get('/', asyncHandler(getProfile));

export default router;
