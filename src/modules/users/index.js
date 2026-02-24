// Export all files of this module from this file.
// Example: export { login } from './services/v1/user.service.js';

export { UserModel } from './models/user.model.js';
export { default as authRoutes } from './routes/v1/auth.routes.js';
export { registerUser } from './services/v1/auth.service.js';
export { register } from './controllers/v1/auth.controller.js';
