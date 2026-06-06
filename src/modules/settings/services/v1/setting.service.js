import { SettingModel } from '#modules/settings/models/setting.model.js';

/**
 * Get all settings
 * @returns settings as an array of objects
 */
export const getAllSettings = async () => {
  return await SettingModel.find();
};
