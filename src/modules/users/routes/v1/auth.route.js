import express from 'express';
import { login } from '../../controllers/v1/auth.controller.js';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.js';

const router = express.Router();

router.post('/login', asyncHandler(login));

export default router;
