import express from 'express';
import { refreshAccessToken } from '../../index.js';

const router = express.Router();

router.post('refresh', refreshAccessToken);

export default router;
