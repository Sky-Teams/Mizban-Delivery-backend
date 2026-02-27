import express from 'express';
import { login, refreshAccessToken } from '../../controllers/v1/auth.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { loginValidator } from '../../dto/login.schema.js';

const router = express.Router();

router.post('/login', validate(loginValidator), asyncHandler(login));
router.post('/refresh', asyncHandler(refreshAccessToken));

export default router;
