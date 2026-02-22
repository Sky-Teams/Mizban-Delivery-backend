import express from 'express';
import { login, refreshAccessToken } from '../../index.js';

const router = express.Router();

router.post('/refresh', refreshAccessToken);
router.post('/login', login);

export default router;
