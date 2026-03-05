export { default as driverRoutes } from './routes/v1/driver.routes.js';
export { default as adminDriverRoutes } from './routes/v1/adminDriver.routes.js';
export { DriverModel } from './models/driver.model.js';
export {
  doesDriverExist,
  createNewDriver,
  updateExistedDriver,
  getDriverInfoByUserId,
  modifyExistedDriver,
  addNewDriver,
  fetchDriverByDriverId,
  fetchDrivers,
} from './services/v1/driver.service.js';
export {
  createDriver,
  updateDriver,
  getDriverProfile,
  addDrvier,
  getAllDrivers,
  getDriver,
  modifyDriver,
} from './controllers/v1/driver.controller.js';
