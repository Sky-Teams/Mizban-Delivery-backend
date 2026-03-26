import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addNewDriver,
  DriverModel,
  fetchDriverByDriverId,
  fetchDrivers,
  getDriverInfoByUserId,
  modifyExistedDriver,
} from '#modules/drivers/index.js';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { AppError } from '#shared/errors/error.js';
import mongoose from 'mongoose';

// Mock the driver model
vi.mock('#modules/drivers/models/driver.model.js', () => ({
  DriverModel: {
    exists: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#shared/utils/jwt.js', () => ({
  hashPassword: vi.fn(),
}));

// ------------------- Mock Mongoose session -------------------
const fakeSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

vi.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession);

describe('Driver Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get driver info by userId', async () => {
    const driverId = 'driver123';
    const userId = 'user567';

    const mockedDriver = {
      _id: driverId,
      user: userId,
      vehicleType: 'van',
      status: 'idle',
      capacity: { maxWeightKg: 100, maxPackages: 5 },
      currentLocation: { coordinates: [0, 0] },
      lastLocationAt: null,
    };

    DriverModel.find.mockResolvedValue(mockedDriver);

    const result = await getDriverInfoByUserId(userId);

    expect(result).toEqual(mockedDriver);
    expect(DriverModel.find).toHaveBeenCalledWith({ user: userId });
  });

  describe('fetchDrivers', () => {
    it('should return paginated drivers', async () => {
      const mockedDrivers = [{ _id: 'd1' }, { _id: 'd2' }];
      DriverModel.countDocuments.mockResolvedValue(10);
      DriverModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockedDrivers),
      });

      const result = await fetchDrivers(2, 2);

      expect(result).toEqual({
        drivers: mockedDrivers,
        totalDrivers: 10,
        totalPages: 5,
      });
      expect(DriverModel.countDocuments).toHaveBeenCalled();
      expect(DriverModel.find).toHaveBeenCalled();
    });
  });

  describe('fetchDriverByDriverId', () => {
    it('should return driver by driverId', async () => {
      const mockedDriver = [{ _id: 'd1', user: 'u1' }];
      DriverModel.findOne.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockedDriver),
      });

      const result = await fetchDriverByDriverId('d1');
      expect(result).toEqual(mockedDriver);
      expect(DriverModel.findOne).toHaveBeenCalledWith({ _id: 'd1' });
    });
  });

  describe('addNewDriver', () => {
    it('should create a driver and commit transaction', async () => {
      const driverData = {
        name: 'John',
        email: 'john@example.com',
        phone: '123456789',
        vehicleType: 'van',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        address: 'Street 123',
        vehicleRegistrationNumber: 'ABC123',
        timeAvailability: { start: '09:00', end: '17:00' },
      };

      hashPassword.mockResolvedValue('hashedPassword');
      UserModel.create.mockResolvedValue([{ _id: 'user123' }]);
      DriverModel.create.mockResolvedValue([
        {
          toObject: () => ({
            _id: 'driver123',
            user: 'user123',
            vehicleType: 'van',
            status: 'idle',
            capacity: { maxWeightKg: 100, maxPackages: 5 },
            currentLocation: { coordinates: [0, 0] },
            address: 'Street 123',
            vehicleRegistrationNumber: 'ABC123',
            timeAvailability: { start: '09:00', end: '17:00' },
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ]);

      const result = await addNewDriver(driverData);

      expect(result.userId).toBe('user123');
      expect(fakeSession.startTransaction).toHaveBeenCalled();
      expect(fakeSession.commitTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });

    it('should abort transaction on error', async () => {
      const driverData = {
        name: 'John',
        email: 'john@example.com',
        phone: '123456789',
        vehicleType: 'van',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        address: 'Street 123',
        vehicleRegistrationNumber: 'ABC123',
        timeAvailability: { start: '09:00', end: '17:00' },
      };

      // Simulate Mongoose create error
      UserModel.create.mockRejectedValue(new Error('Create failed'));

      await expect(addNewDriver(driverData)).rejects.toBeInstanceOf(Error);

      expect(fakeSession.abortTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });
  });

  describe('modifyExistedDriver', () => {
    it('should update driver and user and commit', async () => {
      const driverData = { userId: 'user123', status: 'active', name: 'Updated' };

      const updatedDriverMock = { toObject: () => ({ _id: 'driver123', status: 'active' }) };
      const updatedUserMock = { name: 'Updated', email: 'u@example.com', phone: '123' };

      DriverModel.findByIdAndUpdate = vi.fn().mockResolvedValue(updatedDriverMock);
      UserModel.findOneAndUpdate = vi.fn().mockResolvedValue(updatedUserMock);

      const result = await modifyExistedDriver('driver123', driverData);

      expect(result.status).toBe('active');
      expect(result.name).toBe('Updated');
      expect(result.userId).toBe('user123');
      expect(fakeSession.commitTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });

    it('should abort transaction if no fields provided', async () => {
      const driverData = { userId: 'user123' }; // no update fields

      await expect(modifyExistedDriver('driver123', driverData)).rejects.toBeInstanceOf(AppError);

      expect(fakeSession.abortTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });
  });
});

// We don't need these tests for now
// describe('Driver Service', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });
//   describe('doesDriverExist', () => {
//     it('should return true if driver exists for a user', async () => {
//       DriverModel.exists.mockResolvedValue({ user: 'user567' });

//       const result = await doesDriverExist('user567');

//       expect(result).toBe(true);
//       expect(DriverModel.exists).toHaveBeenCalledWith({ user: 'user567' });
//     });

//     it('should return false if driver does not exist for a user', async () => {
//       DriverModel.exists.mockResolvedValue(null);

//       const result = await doesDriverExist('user999');

//       expect(result).toBe(false);
//       expect(DriverModel.exists).toHaveBeenCalledWith({ user: 'user999' });
//     });
//   });

//   describe('createNewDriver', () => {
//     it('should create a new driver', async () => {
//       const userId = 'user567';
//       const driverData = {
//         vehicleType: 'car',
//         status: 'offline',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         vehicleRegistrationNumber: 'ABC-1234',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       };

//       const mockedDriver = {
//         _id: 'driver123',
//         user: userId,
//         vehicleType: 'car',
//         status: 'offline',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { type: 'Point', coordinates: [0, 0] },
//         lastLocationAt: null,
//         ratingAvg: 0,
//         ratingCount: 0,
//         acceptanceRate: 0,
//         isVerified: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       DriverModel.create.mockResolvedValue(mockedDriver);

//       const result = await createNewDriver(userId, driverData);

//       expect(result).toEqual(mockedDriver);

//       expect(DriverModel.create).toHaveBeenCalledWith({
//         user: userId,
//         vehicleType: 'car',
//         status: 'offline',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         vehicleRegistrationNumber: 'ABC-1234',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       });
//     });

//     it('should throw a validation error for negative capacity values', async () => {
//       const userId = 'user567';
//       const driverData = {
//         vehicleType: 'bike',
//         status: 'offline',
//         capacity: { maxWeightKg: -10, maxPackages: -3 },
//         vehicleRegistrationNumber: 'ABC-1234',
//         timeAvailability: {
//           start: '08:00',
//           end: '18:00',
//         },
//       };

//       const validationError = new Error('Driver validation failed');
//       validationError.name = 'ValidationError';
//       validationError.errors = {
//         'capacity.maxWeightKg': {
//           name: 'ValidatorError',
//           message: 'Path `capacity.maxWeightKg` (-10) is less than minimum allowed value (0).',
//           type: 'min',
//           path: 'capacity.maxWeightKg',
//           value: -10,
//         },
//         'capacity.maxPackages': {
//           name: 'ValidatorError',
//           message: 'Path `capacity.maxPackages` (-3) is less than minimum allowed value (0).',
//           type: 'min',
//           path: 'capacity.maxPackages',
//           value: -3,
//         },
//       };

//       // Mock the create method to throw this validation error
//       DriverModel.create = vi.fn().mockImplementation(() => {
//         throw validationError;
//       });

//       await expect(createNewDriver(userId, driverData)).rejects.toMatchObject({
//         name: 'ValidationError',
//         errors: {
//           'capacity.maxWeightKg': expect.objectContaining({ value: -10 }),
//           'capacity.maxPackages': expect.objectContaining({ value: -3 }),
//         },
//       });
//     });
//   });

//   describe('updateExistedDriver', () => {
//     beforeEach(() => {
//       vi.clearAllMocks();
//     });

//     it('should update driver with partial fields', async () => {
//       const driverId = 'driver123';
//       const userId = 'user567';
//       const driverData = { vehicleType: 'van', status: 'idle' };

//       const mockedDriver = {
//         _id: driverId,
//         user: userId,
//         vehicleType: 'van',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { coordinates: [0, 0] },
//         lastLocationAt: null,
//       };

//       DriverModel.findOneAndUpdate.mockResolvedValue(mockedDriver);

//       const result = await updateExistedDriver(driverId, userId, driverData);

//       expect(result).toEqual(mockedDriver);
//       expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
//         { _id: driverId, user: userId },
//         { $set: driverData },
//         { new: true, runValidators: true }
//       );
//     });

//     it('should update driver with partial fields', async () => {
//       const driverId = 'driver123';
//       const userId = 'user567';
//       const driverData = {
//         capacity: { maxWeightKg: 100 },
//         currentLocation: { coordinates: [0, 0] },
//       };

//       const mockedDriver = {
//         _id: driverId,
//         user: userId,
//         vehicleType: 'van',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { coordinates: [0, 0] },
//         lastLocationAt: null,
//       };

//       DriverModel.findOneAndUpdate.mockResolvedValue(mockedDriver);

//       const result = await updateExistedDriver(driverId, userId, driverData);

//       expect(result).toEqual(mockedDriver);

//       expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
//         { _id: driverId, user: userId },
//         {
//           $set: {
//             'capacity.maxWeightKg': 100,
//             'currentLocation.coordinates': [0, 0],
//           },
//         },
//         { new: true, runValidators: true }
//       );
//     });

//     it('should throw AppError if no fields are provided', async () => {
//       const driverId = 'driver123';
//       const userId = 'user567';
//       const driverData = {};

//       await expect(updateExistedDriver(driverId, userId, driverData)).rejects.toMatchObject({
//         message: 'No fields provided for update',
//         code: ERROR_CODES.NO_FIELDS_PROVIDED,
//         status: 400,
//       });
//     });

//     it('should throw error if driver not found', async () => {
//       const driverId = 'driver123';
//       const userId = 'user567';
//       const driverData = { status: 'idle' };

//       DriverModel.findOneAndUpdate.mockResolvedValue(null);

//       await expect(updateExistedDriver(driverId, userId, driverData)).rejects.toMatchObject({
//         message: 'Driver not found',
//         code: ERROR_CODES.NOT_FOUND,
//         status: 404,
//       });
//     });
//   });

//   describe('getDriverInfoByUserId', () => {
//     beforeEach(() => {
//       vi.clearAllMocks();
//     });
//     it('should get driver info by userId', async () => {
//       const driverId = 'driver123';
//       const userId = 'user567';

//       const mockedDriver = {
//         _id: driverId,
//         user: userId,
//         vehicleType: 'van',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { coordinates: [0, 0] },
//         lastLocationAt: null,
//       };

//       DriverModel.find.mockResolvedValue(mockedDriver);

//       const result = await getDriverInfoByUserId(userId);

//       expect(result).toEqual(mockedDriver);
//       expect(DriverModel.find).toHaveBeenCalledWith({ user: userId });
//     });
//   });
// });
