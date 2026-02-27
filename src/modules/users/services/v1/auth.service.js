import { getUserByEmail, validateLoginUser } from '#shared/utils/auth.helper.js';
import { generateAccessToken } from '#shared/utils/jwt.js';

export const loginService = async ({ email, password }) => {
  const user = await getUserByEmail(email);

  await validateLoginUser(user, password);

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    token: generateAccessToken(user),
  };
};
