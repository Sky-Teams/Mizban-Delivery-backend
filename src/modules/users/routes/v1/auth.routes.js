import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { register } from '../../controllers/v1/auth.controller.js';
import { validate } from '#shared/middleware/validate.js';
import { registerUserValidator } from '../../dto/register.user.schema.js';

const router = express.Router();

router.post('/register', validate(registerUserValidator), asyncHandler(register));

export default router;
