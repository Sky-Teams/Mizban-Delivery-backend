import express from 'express';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.js';
import { register } from '../../index.js';

const router = express.Router();

router.post('/register', asyncHandler(register));

export default router;
