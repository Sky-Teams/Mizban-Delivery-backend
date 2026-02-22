import express from 'express';
import { createDriver } from '../../index.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';

const router = express.Router();

router.post('/', asyncHandler(createDriver));

export default router;
