import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { login } from '../../controllers/v1/auth.controller.js';
import { loginValidator } from '../../dto/login.schema.js';
import { register } from '../../controllers/v1/auth.controller.js';
import { registerUserValidator } from '../../dto/register.user.schema.js';

const router = express.Router();

router.post('/register', validate(registerUserValidator), asyncHandler(register));
router.post('/login', validate(loginValidator), asyncHandler(login));

export default router;
