import express from 'express';
import { loginController } from '../../controllers/v1/auth.controller.js';

const router = express.Router();

router.post('/login', loginController);

export default router;
