import { getLog, getLogs, getLogStats } from '#modules/log/controllers/v1/log.controller.js';
import { logIdValidator } from '#modules/log/dto/log-id-validator.js';
import { logQueryValidator } from '#modules/log/dto/log-query-validator.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import express from 'express';

const router = express.Router();

router.get('/', validate(logQueryValidator), asyncHandler(getLogs));
router.get('/log-stats', validate(logQueryValidator), asyncHandler(getLogStats));
router.get('/:logId', validate(logIdValidator), validate(logQueryValidator), asyncHandler(getLog));

export default router;
