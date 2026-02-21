import { login } from '../../services/v1/auth.service.js';

export const loginController = async (req, res) => {
  const user = await login(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
};
