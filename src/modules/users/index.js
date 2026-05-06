// Export all files of this module from this file.

export { UserModel } from './models/user.model.js';
export { default as authRoutes } from './routes/v1/auth.routes.js';
export {
  registerUser,
  doesUserExist,
  getAllAdmins,
  createUserFromGoogle,
  authenticateWithGoogle,
  generateTokens,
  findOrCreateUser,
} from './services/v1/auth.service.js';
export { register, googleLogin } from './controllers/v1/auth.controller.js';

export { default as userRoutes } from './routes/v1/user.routes.js';
export { default as deviceRoutes } from './routes/v1/device.routes.js';
export { getProfile, registerDevice, updateDevice } from './controllers/v1/user.controller.js';
export { getUserProfile } from './services/v1/user.service.js';
