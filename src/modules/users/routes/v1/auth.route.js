import express from 'express';
import { login, refreshAccessToken } from '../../controllers/v1/auth.controller.js';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.js';

const router = express.Router();

router.post('/refresh', asyncHandler(refreshAccessToken));
router.post('/login', asyncHandler(login));

export default router;
