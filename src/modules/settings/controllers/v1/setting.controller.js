import {
  getAllSettings,
  updateSettingByKey,
} from '#modules/settings/services/v1/setting.service.js';
import { unauthorized } from '#shared/errors/error.js';

export const getSettings = async (req, res) => {
  if (!req.user) throw unauthorized();

  const settings = await getAllSettings();

  res.status(200).json({ success: true, data: settings });
};

export const updateSetting = async (req, res) => {
  if (!req.user) throw unauthorized();

  const settingKey = req.params.key;
  const value = req.body.value;

  const updatedSetting = await updateSettingByKey(settingKey, value);

  res.status(200).json({ success: true, data: updatedSetting });
};
