// Export all files of this module from this file.

export { UserModel } from './models/user.model.js';
export { default as authRoutes } from './routes/v1/auth.routes.js';
export { registerUser, doesUserExist } from './services/v1/auth.service.js';
export { register } from './controllers/v1/auth.controller.js';

export { default as userRoutes } from './routes/v1/user.routes.js';
export { getProfile } from './controllers/v1/user.contoller.js';
export { getUserProfile } from './services/v1/user.service.js';
