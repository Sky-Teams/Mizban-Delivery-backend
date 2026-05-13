import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { registerDevice, updateDevice } from '../../controllers/v1/user.controller.js';
import { validate } from '#shared/middleware/validate.js';
import { registerDeviceValidator, updateDeviceValidator } from '../../dto/device.schema.js';

const router = express.Router();

router.post('/', validate(registerDeviceValidator), asyncHandler(registerDevice));
router.put('/:deviceId', validate(updateDeviceValidator), asyncHandler(updateDevice));

export default router;
