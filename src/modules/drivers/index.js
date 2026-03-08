export { default as driverRoutes } from './routes/v1/driver.routes.js';
export { DriverModel } from './models/driver.model.js';
export {
  doesDriverExist,
  doesDriverExistByDriverId,
  createNewDriver,
  updateExistedDriver,
} from './services/v1/driver.service.js';
export { createDriver, updateDriver } from './controllers/v1/driver.controller.js';
