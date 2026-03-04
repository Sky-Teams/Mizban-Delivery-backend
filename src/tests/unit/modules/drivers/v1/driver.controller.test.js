import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDriver,
  updateExistedDriver,
  updateDriver,
  getDriverProfile,
  getDriverInfoByUserId,
} from '#modules/drivers/index.js';
import { doesDriverExist, createNewDriver } from '#modules/drivers/index.js';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

vi.mock('#modules/drivers/services/v1/driver.service.js', () => ({
  doesDriverExist: vi.fn(),
  createNewDriver: vi.fn(),
  updateExistedDriver: vi.fn(),
  getDriverInfoByUserId: vi.fn(),
}));

describe('createDriver Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user123' },
      body: {
        vehicleType: 'car',
        status: 'idle',
        capacity: { maxWeightKg: 100, maxPackages: 5 },
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(createDriver(req, res)).rejects.toMatchObject({
      message: 'User is not authorized',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should throw error if driver already exists', async () => {
    doesDriverExist.mockResolvedValue(true);

    await expect(createDriver(req, res)).rejects.toThrow(AppError);

    expect(doesDriverExist).toHaveBeenCalledWith('user123');
    expect(createNewDriver).not.toHaveBeenCalled();
  });

  it('should create driver and return 201', async () => {
    const mockedDriver = {
      _id: 'driver123',
      user: 'user123',
      vehicleType: 'car',
      status: 'idle',
      capacity: { maxWeightKg: 100, maxPackages: 5 },
    };

    doesDriverExist.mockResolvedValue(false);
    createNewDriver.mockResolvedValue(mockedDriver);

    await createDriver(req, res);

    expect(doesDriverExist).toHaveBeenCalledWith('user123');
    expect(createNewDriver).toHaveBeenCalledWith('user123', req.body);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockedDriver,
    });
  });

  it('should propagate error from createNewDriver', async () => {
    doesDriverExist.mockResolvedValue(false);

    const error = new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR);
    createNewDriver.mockRejectedValue(error);

    await expect(createDriver(req, res)).rejects.toThrow(AppError);
    await expect(createDriver(req, res)).rejects.toMatchObject({
      message: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  });
});

describe('updateDriver Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user123' },
      params: { id: 'driver123' },
      body: {
        capacity: { maxWeightKg: 100, maxPackages: 5 },
        currentLocation: { coordinates: [0, 0] },
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(updateDriver(req, res)).rejects.toMatchObject({
      message: 'User is not authorized',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should call updateExistedDriver and return 200 with updated driver', async () => {
    const mockedDriver = {
      _id: 'driver123',
      user: 'user123',
      vehicleType: 'car',
      status: 'idle',
      capacity: { maxWeightKg: 100, maxPackages: 5 },
      currentLocation: { coordinates: [0, 0] },
      lastLocationAt: null,
    };

    updateExistedDriver.mockResolvedValue(mockedDriver);

    await updateDriver(req, res);

    expect(updateExistedDriver).toHaveBeenCalledWith('driver123', 'user123', req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockedDriver,
    });
  });

  it('should propagate error from updateExistedDriver', async () => {
    const error = new AppError('No fields provided', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
    updateExistedDriver.mockRejectedValue(error);

    await expect(updateDriver(req, res)).rejects.toThrow(AppError);
    await expect(updateDriver(req, res)).rejects.toMatchObject({
      message: 'No fields provided',
      code: ERROR_CODES.NO_FIELDS_PROVIDED,
    });
  });
});

describe('getDriverProfile Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user123' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(getDriverProfile(req, res)).rejects.toMatchObject({
      message: 'User is not authorized',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should call getDriverInfoByUserId and return 200 with driver info', async () => {
    const mockedDriver = {
      _id: 'driver123',
      user: 'user123',
      vehicleType: 'car',
      status: 'idle',
      capacity: { maxWeightKg: 100, maxPackages: 5 },
      currentLocation: { coordinates: [0, 0] },
      lastLocationAt: null,
    };

    getDriverInfoByUserId.mockResolvedValue(mockedDriver);

    await getDriverProfile(req, res);

    expect(getDriverInfoByUserId).toHaveBeenCalledWith(req.user._id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockedDriver,
    });
  });

  it('should propagate error from getDriverProfile', async () => {
    getDriverInfoByUserId.mockResolvedValue(null);

    await expect(getDriverProfile(req, res)).rejects.toThrow(AppError);
    await expect(getDriverProfile(req, res)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
    });
  });
});
