import express from 'express';
import { refreshAccessToken } from '../../index.js';

const router = express.Router();

// import { loginController } from '../../controllers/v1/auth.controller.js';

router.post('/refresh', refreshAccessToken);
router.post('/login', loginController);

export default router;
