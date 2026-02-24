import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
  console.log(user);
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
