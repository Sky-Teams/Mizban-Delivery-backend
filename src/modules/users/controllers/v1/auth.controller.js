import { cookieOptions } from '#shared/utils/jwt.js';
import { getDeviceId } from '#shared/utils/auth.helper.js';
import { loginService, refreshService } from '../../services/v1/auth.service.js';

export const login = async (req, res) => {
  const deviceId = getDeviceId(req);

  const { accessToken, refreshToken, id, email } = await loginService(req.body, deviceId);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: { accessToken, id, email, role },
  });
};

export const refreshAccessToken = async (req, res) => {
  const deviceId = getDeviceId(req);
  const refreshToken = req.cookies?.refreshToken;

  const { accessToken, refreshToken: rotatedRefreshToken } = await refreshService({
    refreshToken,
    deviceId,
  });

  res.cookie('refreshToken', rotatedRefreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
};
