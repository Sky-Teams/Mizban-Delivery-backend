export { default as driverRoutes } from './routes/v1/driver.routes.js';
export { DriverModel } from './models/driver.model.js';
export {
  doesDriverExist,
  createNewDriver,
  getDriverInfoByUserId,
  modifyExistedDriver,
  addNewDriver,
  fetchDriverByDriverId,
  fetchDrivers,
} from './services/v1/driver.service.js';
export {
  addDriver,
  getAllDrivers,
  getDriver,
  modifyDriver,
} from './controllers/v1/driver.controller.js';
