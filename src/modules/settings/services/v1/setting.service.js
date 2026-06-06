import { SettingModel } from '#modules/settings/models/setting.model.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { settingKeys } from '#shared/utils/enums.js';
import { validateSettingValue } from '#shared/utils/settingsValidator.js';

/**
 * Get all settings
 * @returns settings as an array of objects
 */
export const getAllSettings = async () => {
  return await SettingModel.find();
};

/**
 * Update a setting by key
 * @param {String} key
 * @param {Mixed} value - the value can be changed based on the settings type.(ex: number, string, boolean)
 * @returns Updated setting as an object
 */
export const updateSettingByKey = async (key, value) => {
  if (!Object.values(settingKeys).includes(key))
    throw new AppError('Invalid setting key', 400, ERROR_CODES.INVALID_SETTING_KEY);

  validateSettingValue(key, value);

  const updatedSetting = await SettingModel.findOneAndUpdate(
    { key },
    { value },
    { returnDocument: 'after' }
  );

  if (!updatedSetting) throw notFound('Setting');

  return updatedSetting;
};
