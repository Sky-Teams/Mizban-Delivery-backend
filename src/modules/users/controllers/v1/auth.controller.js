import { registerService } from '../../services/v1/auth.service.js';

export const register = async (req, res) => {
  const data = req.body;

  await registerService(data);

  res.status(200).json({
    success: true,
    message: 'User register successfully',
  });
};
