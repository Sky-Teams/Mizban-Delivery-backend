import { getAllSettings } from '#modules/settings/services/v1/setting.service.js';
import { unauthorized } from '#shared/errors/error.js';

export const getSettings = async (req, res) => {
  if (!req.user) throw unauthorized();

  const settings = await getAllSettings();

  res.status(200).json({ success: true, data: settings });
};
