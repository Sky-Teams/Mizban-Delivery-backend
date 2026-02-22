export const refreshAccessToken = async (req, res) => {
  const { accessToken } = refreshService(req.cookies.refreshToken);

  res.status(200).json({
    success: true,
    data: accessToken,
  });
};

// console.log(new Date());    2026-02-21T15:25:37.569Z
// console.log(Date.now());    1771687537628
import { login } from '../../services/v1/auth.service.js';

export const loginController = async (req, res) => {
  const user = await login(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
};
