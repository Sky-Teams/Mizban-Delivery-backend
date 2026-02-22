import { loginService } from '../../services/v1/auth.service.js';

export const login = async (req, res) => {
  const user = await loginService(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
};
