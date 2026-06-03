import express from 'express';
import {
  acceptDriverRegistrationRequest,
  addDriver,
  createDriver,
  getAllDrivers,
  getDriver,
  modifyDriver,
  rejectDriverRegistrationRequest,
} from '../../controllers/v1/driver.controller.js';
import { asyncHandler } from '#shared/middleware/asyncHandler.js';
import { validate } from '#shared/middleware/validate.js';
import { mongoIdValidator } from '#shared/middleware/mongoIdValidator.js';
import { createDriverValidator } from '../../dto/create-driver.schema.js';
import { updateDriverValidator } from '../../dto/update-driver.schema.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { ROLES } from '#shared/utils/enums.js';
import { createDriverProfileValidator } from '#modules/drivers/dto/user-create-driver.schema.js';
import uploadFile from '#shared/middleware/uploadFile.js';
import { rejectDriverValidator } from '#modules/drivers/dto/reject-driver.schema.js';

const router = express.Router();

router.post(
  '/',
  authorizeRole(ROLES.ADMIN),
  validate(createDriverValidator),
  asyncHandler(addDriver)
);
router.post(
  '/registration',
  authorizeRole(ROLES.DRIVER),
  uploadFile.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'nationalIdCardFront', maxCount: 1 },
    { name: 'nationalIdCardBack', maxCount: 1 },
    { name: 'driverLicense', maxCount: 1 },
    { name: 'vehicleCard', maxCount: 1 },
  ]),
  validate(createDriverProfileValidator),
  asyncHandler(createDriver)
);
//Accept the driver registration request
router.patch(
  '/:id/verification/approve', // id => Driver Id
  authorizeRole(ROLES.ADMIN),
  validate(mongoIdValidator),
  asyncHandler(acceptDriverRegistrationRequest)
);
//Reject the driver registration request
router.patch(
  '/:id/verification/reject', // id => Driver Id
  authorizeRole(ROLES.ADMIN),
  validate(mongoIdValidator),
  validate(rejectDriverValidator),
  asyncHandler(rejectDriverRegistrationRequest)
);
router.get('/', authorizeRole(ROLES.ADMIN), asyncHandler(getAllDrivers));
router.get('/:id', authorizeRole(ROLES.ADMIN), validate(mongoIdValidator), asyncHandler(getDriver)); // route /:id => id is driverId
router.put(
  '/:id', // route /:id => id is driverId
  authorizeRole(ROLES.ADMIN),
  validate(mongoIdValidator),
  validate(updateDriverValidator),
  asyncHandler(modifyDriver)
);

export default router;
