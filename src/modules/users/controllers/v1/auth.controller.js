import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import { doesUserExist, registerUser } from '../../services/v1/auth.service.js';

export const register = async (req, res) => {
  const data = req.body;

  const emailExist = await doesUserExist({ email: data.email });
  if (emailExist) throw new AppError('Email already exists', 400, ERROR_CODES.DUPLICATE);

  await registerUser(data);

  res.status(200).json({
    success: true,
    message: 'User registered successfully',
  });
};
