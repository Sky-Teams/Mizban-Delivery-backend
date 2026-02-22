import express from 'express';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.js';
import { register } from '../../controllers/v1/auth.controller.js';

const router = express.Router();

router.post('/register', asyncHandler(register));

export default router;
