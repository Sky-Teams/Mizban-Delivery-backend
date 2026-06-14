import express from 'express';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { getSettings, updateSetting } from '#modules/settings/controllers/v1/setting.controller.js';
import { validate } from '#shared/middleware/validate.js';
import { updateSettingValidator } from '#modules/settings/dto/update-setting.schema.js';

const router = express.Router();

router.get('/', asyncHandler(getSettings));
router.patch('/:key', validate(updateSettingValidator), asyncHandler(updateSetting)); // /:id => id of the setting

export default router;
