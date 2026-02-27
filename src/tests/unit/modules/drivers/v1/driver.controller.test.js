import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDriver } from '#modules/drivers/index.js';
import { doesDriverExist, createNewDriver } from '#modules/drivers/index.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/drivers/services/v1/driver.service.js', () => ({
  doesDriverExist: vi.fn(),
  createNewDriver: vi.fn(),
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

    await expect(createDriver(req, res)).rejects.toThrow();
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

    const error = new Error('Validation failed');
    createNewDriver.mockRejectedValue(error);

    await expect(createDriver(req, res)).rejects.toThrow('Validation failed');
  });
});
