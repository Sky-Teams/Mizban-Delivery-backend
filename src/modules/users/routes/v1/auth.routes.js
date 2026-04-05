import express from 'express';
import {
  googleLogin,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from '../../controllers/v1/auth.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { loginValidator } from '../../dto/login.schema.js';
import { register } from '../../controllers/v1/auth.controller.js';
import { registerUserValidator } from '../../dto/register.user.schema.js';
import { forgotPasswordValidator } from '#modules/users/dto/forgot-password.schema.js';
import { resetPasswordValidator } from '../../dto/reset-password.schema.js';

const router = express.Router();

router.post('/register', validate(registerUserValidator), asyncHandler(register));
router.post('/login', validate(loginValidator), asyncHandler(login));
router.post('/refresh', asyncHandler(refreshAccessToken));
router.post('/forgot-password', validate(forgotPasswordValidator), asyncHandler(forgotPassword));
router.post(
  '/reset-password/:resetToken',
  validate(resetPasswordValidator),
  asyncHandler(resetPassword)
);

router.post('/google', asyncHandler(googleLogin));
export default router;
