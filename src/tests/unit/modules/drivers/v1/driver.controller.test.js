import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addDriver,
  modifyDriver,
  getAllDrivers,
  getDriver,
  addNewDriver,
  modifyExistedDriver,
  fetchDrivers,
  fetchDriverByDriverId,
} from '#modules/drivers/index.js';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

vi.mock('#modules/drivers/services/v1/driver.service.js', () => ({
  doesDriverExist: vi.fn(),
  createNewDriver: vi.fn(),
  updateExistedDriver: vi.fn(),
  getDriverInfoByUserId: vi.fn(),
  addNewDriver: vi.fn(),
  modifyExistedDriver: vi.fn(),
  fetchDrivers: vi.fn(),
  fetchDriverByDriverId: vi.fn(),
}));

describe('Driver Controllers', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('addDriver', () => {
    beforeEach(() => {
      req = {
        user: { _id: 'user123' },
        body: {
          name: 'John',
          email: 'john@example.com',
          phone: '123456789',
          vehicleType: 'van',
        },
      };
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;
      await expect(addDriver(req, res)).rejects.toBeInstanceOf(AppError);
    });

    it('should create a driver and return 201', async () => {
      const mockedDriver = { _id: 'driver123', name: 'John' };
      addNewDriver.mockResolvedValue(mockedDriver);

      await addDriver(req, res);

      expect(addNewDriver).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockedDriver });
    });

    it('should propagate service error', async () => {
      const error = new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR);
      addNewDriver.mockRejectedValue(error);

      await expect(addDriver(req, res)).rejects.toThrow(AppError);
    });
  });

  describe('modifyDriver', () => {
    beforeEach(() => {
      req = {
        user: { _id: 'user123' },
        params: { id: 'driver123' },
        body: { status: 'active' },
      };
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;
      await expect(modifyDriver(req, res)).rejects.toBeInstanceOf(AppError);
    });

    it('should update driver and return 200', async () => {
      const updatedDriver = { _id: 'driver123', status: 'active' };
      modifyExistedDriver.mockResolvedValue(updatedDriver);

      await modifyDriver(req, res);

      expect(modifyExistedDriver).toHaveBeenCalledWith('driver123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedDriver });
    });

    it('should propagate service error', async () => {
      const error = new AppError('No fields provided', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
      modifyExistedDriver.mockRejectedValue(error);

      await expect(modifyDriver(req, res)).rejects.toThrow(AppError);
    });
  });

  describe('getAllDrivers', () => {
    beforeEach(() => {
      req = {
        user: { _id: 'user123' },
        query: { limit: '5', page: '2', searchTerm: 'John', vehicleType: 'van' },
      };
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;
      await expect(getAllDrivers(req, res)).rejects.toBeInstanceOf(AppError);
    });

    it('should fetch drivers and return 200', async () => {
      const mockData = {
        drivers: [{ _id: 'driver1' }],
        totalDrivers: 10,
        totalPages: 2,
      };
      fetchDrivers.mockResolvedValue(mockData);

      await getAllDrivers(req, res);

      expect(fetchDrivers).toHaveBeenCalledWith(5, 2, {
        searchTerm: 'John',
        vehicleType: 'van',
        status: undefined,
        isVerified: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData.drivers,
        totalDrivers: 10,
        totalPages: 2,
      });
    });

    it('should propagate service error', async () => {
      const error = new AppError('Fetch failed', 400, ERROR_CODES.TRANSACTION_FAILED);
      fetchDrivers.mockRejectedValue(error);

      await expect(getAllDrivers(req, res)).rejects.toThrow(AppError);
    });
  });

  describe('getDriver', () => {
    beforeEach(() => {
      req = {
        user: { _id: 'user123' },
        params: { id: 'driver123' },
      };
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;
      await expect(getDriver(req, res)).rejects.toBeInstanceOf(AppError);
    });

    it('should fetch driver by ID and return 200', async () => {
      const driver = { _id: 'driver123', name: 'John' };
      fetchDriverByDriverId.mockResolvedValue(driver);

      await getDriver(req, res);

      expect(fetchDriverByDriverId).toHaveBeenCalledWith('driver123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: driver });
    });

    it('should propagate service error', async () => {
      const error = new AppError('Not found', 404, ERROR_CODES.NOT_FOUND);
      fetchDriverByDriverId.mockRejectedValue(error);

      await expect(getDriver(req, res)).rejects.toThrow(AppError);
    });
  });
});

// we don't need these tests.
// describe('createDriver Controller', () => {
//   let req, res;

//   beforeEach(() => {
//     vi.clearAllMocks();

//     req = {
//       user: { _id: 'user123' },
//       body: {
//         vehicleType: 'car',
//         status: 'idle',
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//       },
//     };

//     res = {
//       status: vi.fn().mockReturnThis(),
//       json: vi.fn(),
//     };
//   });

//   it('should throw unauthorized error if user is missing', async () => {
//     req.user = null;

//     await expect(createDriver(req, res)).rejects.toMatchObject({
//       message: 'User is not authorized',
//       code: ERROR_CODES.UNAUTHORIZED,
//     });
//   });

//   it('should throw error if driver already exists', async () => {
//     doesDriverExist.mockResolvedValue(true);

//     await expect(createDriver(req, res)).rejects.toThrow(AppError);

//     expect(doesDriverExist).toHaveBeenCalledWith('user123');
//     expect(createNewDriver).not.toHaveBeenCalled();
//   });

//   it('should create driver and return 201', async () => {
//     const mockedDriver = {
//       _id: 'driver123',
//       user: 'user123',
//       vehicleType: 'car',
//       status: 'idle',
//       capacity: { maxWeightKg: 100, maxPackages: 5 },
//     };

//     doesDriverExist.mockResolvedValue(false);
//     createNewDriver.mockResolvedValue(mockedDriver);

//     await createDriver(req, res);

//     expect(doesDriverExist).toHaveBeenCalledWith('user123');
//     expect(createNewDriver).toHaveBeenCalledWith('user123', req.body);

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       data: mockedDriver,
//     });
//   });

//   it('should propagate error from createNewDriver', async () => {
//     doesDriverExist.mockResolvedValue(false);

//     const error = new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR);
//     createNewDriver.mockRejectedValue(error);

//     await expect(createDriver(req, res)).rejects.toThrow(AppError);
//     await expect(createDriver(req, res)).rejects.toMatchObject({
//       message: 'Validation failed',
//       code: ERROR_CODES.VALIDATION_ERROR,
//     });
//   });
// });

// describe('updateDriver Controller', () => {
//   let req, res;

//   beforeEach(() => {
//     vi.clearAllMocks();

//     req = {
//       user: { _id: 'user123' },
//       params: { id: 'driver123' },
//       body: {
//         capacity: { maxWeightKg: 100, maxPackages: 5 },
//         currentLocation: { coordinates: [0, 0] },
//       },
//     };

//     res = {
//       status: vi.fn().mockReturnThis(),
//       json: vi.fn(),
//     };
//   });

//   it('should throw unauthorized error if user is missing', async () => {
//     req.user = null;

//     await expect(updateDriver(req, res)).rejects.toMatchObject({
//       message: 'User is not authorized',
//       code: ERROR_CODES.UNAUTHORIZED,
//     });
//   });

//   it('should call updateExistedDriver and return 200 with updated driver', async () => {
//     const mockedDriver = {
//       _id: 'driver123',
//       user: 'user123',
//       vehicleType: 'car',
//       status: 'idle',
//       capacity: { maxWeightKg: 100, maxPackages: 5 },
//       currentLocation: { coordinates: [0, 0] },
//       lastLocationAt: null,
//     };

//     updateExistedDriver.mockResolvedValue(mockedDriver);

//     await updateDriver(req, res);

//     expect(updateExistedDriver).toHaveBeenCalledWith('driver123', 'user123', req.body);

//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       data: mockedDriver,
//     });
//   });

//   it('should propagate error from updateExistedDriver', async () => {
//     const error = new AppError('No fields provided', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
//     updateExistedDriver.mockRejectedValue(error);

//     await expect(updateDriver(req, res)).rejects.toThrow(AppError);
//     await expect(updateDriver(req, res)).rejects.toMatchObject({
//       message: 'No fields provided',
//       code: ERROR_CODES.NO_FIELDS_PROVIDED,
//     });
//   });
// });

// describe('getDriverProfile Controller', () => {
//   let req, res;

//   beforeEach(() => {
//     vi.clearAllMocks();

//     req = {
//       user: { _id: 'user123' },
//     };

//     res = {
//       status: vi.fn().mockReturnThis(),
//       json: vi.fn(),
//     };
//   });

//   it('should throw unauthorized error if user is missing', async () => {
//     req.user = null;

//     await expect(getDriverProfile(req, res)).rejects.toMatchObject({
//       message: 'User is not authorized',
//       code: ERROR_CODES.UNAUTHORIZED,
//     });
//   });

//   it('should call getDriverInfoByUserId and return 200 with driver info', async () => {
//     const mockedDriver = {
//       _id: 'driver123',
//       user: 'user123',
//       vehicleType: 'car',
//       status: 'idle',
//       capacity: { maxWeightKg: 100, maxPackages: 5 },
//       currentLocation: { coordinates: [0, 0] },
//       lastLocationAt: null,
//     };

//     getDriverInfoByUserId.mockResolvedValue(mockedDriver);

//     await getDriverProfile(req, res);

//     expect(getDriverInfoByUserId).toHaveBeenCalledWith(req.user._id);

//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       data: mockedDriver,
//     });
//   });

//   it('should propagate error from getDriverProfile', async () => {
//     getDriverInfoByUserId.mockResolvedValue(null);

//     await expect(getDriverProfile(req, res)).rejects.toThrow(AppError);
//     await expect(getDriverProfile(req, res)).rejects.toMatchObject({
//       code: ERROR_CODES.NOT_FOUND,
//     });
//   });
// });
