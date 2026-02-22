import { loginService, refreshService } from '../../services/v1/auth.service.js';

export const refreshAccessToken = async (req, res) => {
  const { accessToken } = await refreshService(req.cookies.refreshToken);

  res.status(200).json({
    success: true,
    data: accessToken,
  });
};

// console.log(new Date());    2026-02-21T15:25:37.569Z
// console.log(Date.now());    1771687537628

export const login = async (req, res) => {
  const { accessToken, refreshToken, id, email } = await loginService(req.body);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    data: { accessToken, id, email },
  });
};
