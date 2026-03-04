import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverModel, getDriverInfoByUserId } from '#modules/drivers/index.js';
import { doesDriverExist, createNewDriver, updateExistedDriver } from '#modules/drivers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

// Mock the driver model
vi.mock('#modules/drivers/models/driver.model.js', () => ({
  DriverModel: {
    exists: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
  },
}));

describe('Driver Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('doesDriverExist', () => {
    it('should return true if driver exists for a user', async () => {
      DriverModel.exists.mockResolvedValue({ user: 'user567' });

      const result = await doesDriverExist('user567');

      expect(result).toBe(true);
      expect(DriverModel.exists).toHaveBeenCalledWith({ user: 'user567' });
    });

    it('should return false if driver does not exist for a user', async () => {
      DriverModel.exists.mockResolvedValue(null);

      const result = await doesDriverExist('user999');

      expect(result).toBe(false);
      expect(DriverModel.exists).toHaveBeenCalledWith({ user: 'user999' });
    });
  });

  describe('createNewDriver', () => {
    it('should create a new driver', async () => {
      const userId = 'user567';
      const driverData = {
        vehicleType: 'car',
        status: 'offline',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      };

      const mockedDriver = {
        _id: 'driver123',
        user: userId,
        vehicleType: 'car',
        status: 'offline',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        currentLocation: { type: 'Point', coordinates: [0, 0] },
        lastLocationAt: null,
        ratingAvg: 0,
        ratingCount: 0,
        acceptanceRate: 0,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      DriverModel.create.mockResolvedValue(mockedDriver);

      const result = await createNewDriver(userId, driverData);

      expect(result).toEqual(mockedDriver);

      expect(DriverModel.create).toHaveBeenCalledWith({
        user: userId,
        vehicleType: 'car',
        status: 'offline',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      });
    });

    it('should throw a validation error for negative capacity values', async () => {
      const userId = 'user567';
      const driverData = {
        vehicleType: 'bike',
        status: 'offline',
        capacity: { maxWeightKg: -10, maxPackages: -3 },
      };

      const validationError = new Error('Driver validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        'capacity.maxWeightKg': {
          name: 'ValidatorError',
          message: 'Path `capacity.maxWeightKg` (-10) is less than minimum allowed value (0).',
          type: 'min',
          path: 'capacity.maxWeightKg',
          value: -10,
        },
        'capacity.maxPackages': {
          name: 'ValidatorError',
          message: 'Path `capacity.maxPackages` (-3) is less than minimum allowed value (0).',
          type: 'min',
          path: 'capacity.maxPackages',
          value: -3,
        },
      };

      // Mock the create method to throw this validation error
      DriverModel.create = vi.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(createNewDriver(userId, driverData)).rejects.toMatchObject({
        name: 'ValidationError',
        errors: {
          'capacity.maxWeightKg': expect.objectContaining({ value: -10 }),
          'capacity.maxPackages': expect.objectContaining({ value: -3 }),
        },
      });
    });
  });

  describe('updateExistedDriver', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update driver with partial fields', async () => {
      const driverId = 'driver123';
      const userId = 'user567';
      const driverData = { vehicleType: 'van', status: 'idle' };

      const mockedDriver = {
        _id: driverId,
        user: userId,
        vehicleType: 'van',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        currentLocation: { coordinates: [0, 0] },
        lastLocationAt: null,
      };

      DriverModel.findOneAndUpdate.mockResolvedValue(mockedDriver);

      const result = await updateExistedDriver(driverId, userId, driverData);

      expect(result).toEqual(mockedDriver);
      expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: driverId, user: userId },
        { $set: driverData },
        { new: true, runValidators: true }
      );
    });

    it('should update driver with partial fields', async () => {
      const driverId = 'driver123';
      const userId = 'user567';
      const driverData = {
        capacity: { maxWeightKg: 100 },
        currentLocation: { coordinates: [0, 0] },
      };

      const mockedDriver = {
        _id: driverId,
        user: userId,
        vehicleType: 'van',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        currentLocation: { coordinates: [0, 0] },
        lastLocationAt: null,
      };

      DriverModel.findOneAndUpdate.mockResolvedValue(mockedDriver);

      const result = await updateExistedDriver(driverId, userId, driverData);

      expect(result).toEqual(mockedDriver);

      expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: driverId, user: userId },
        {
          $set: {
            'capacity.maxWeightKg': 100,
            'currentLocation.coordinates': [0, 0],
          },
        },
        { new: true, runValidators: true }
      );
    });

    it('should throw AppError if no fields are provided', async () => {
      const driverId = 'driver123';
      const userId = 'user567';
      const driverData = {};

      await expect(updateExistedDriver(driverId, userId, driverData)).rejects.toMatchObject({
        message: 'No fields provided for update',
        code: ERROR_CODES.NO_FIELDS_PROVIDED,
        status: 400,
      });
    });

    it('should throw error if driver not found', async () => {
      const driverId = 'driver123';
      const userId = 'user567';
      const driverData = { status: 'idle' };

      DriverModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(updateExistedDriver(driverId, userId, driverData)).rejects.toMatchObject({
        message: 'Driver not found',
        code: ERROR_CODES.NOT_FOUND,
        status: 404,
      });
    });
  });

  describe('getDriverInfoByUserId', () => {
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
  });

  describe('Admin Services', () => {
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
  });
});
