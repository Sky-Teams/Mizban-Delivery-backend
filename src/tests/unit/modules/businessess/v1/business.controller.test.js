import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBusiness,
  getBusinesses,
  getBusiness,
} from '#modules/businesses/controllers/v1/business.controller.js';
import {
  createNewBusiness,
  DoesBusinessesExist,
  getAllBusinesses,
  getBusinessById,
} from '#modules/businesses/services/v1/business.service.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  createNewBusiness: vi.fn(),
  DoesBusinessesExist: vi.fn(),
  getAllBusinesses: vi.fn(),
  getBusinessById: vi.fn(),
}));

describe('Controller Business - create business ', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    DoesBusinessesExist.mockResolvedValue(false);

    req = {
      user: { _id: 'user1' },
      body: {
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: {
          type: 'Point',
          coordinates: [34.35, 62.2],
        },
        phone: '0093781234567',
        prepTimeAvgMinutes: 30,
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(createBusiness(req, res)).rejects.toThrow();
  });

  it('should create business and success response', async () => {
    const mockBusiness = {
      _id: '1',
      owner: '69a2954a71fdaea523228f8d',
      name: 'Reyhan Restaurant',
      type: 'restaurant',
      phone: '0093781234567',
      addressText: 'Afghanistan, Herat',
      location: {
        type: 'Point',
        coordinates: [34.35, 62.2],
      },
      prepTimeAvgMinutes: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    createNewBusiness.mockResolvedValue(mockBusiness);

    await createBusiness(req, res);

    expect(createNewBusiness).toHaveBeenCalledWith(req.user._id, req.body);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBusiness,
    });
  });

  it('should propagate error from service ', async () => {
    const error = new Error('DB failed');
    createNewBusiness.mockRejectedValue(error);

    await expect(createBusiness(req, res)).rejects.toThrow('DB failed');
  });
});

describe('Controller Business - get businesses', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user1' },
      query: {},
      params: { id: '507f191e810c19729de860ea' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should return all businesses', async () => {
    const businesses = [
      { _id: '1', name: 'Reyhan Restaurant' },
      { _id: '2', name: 'Mizban Shop' },
    ];
    getAllBusinesses.mockResolvedValue({ businesses, totalBusinesses: 2, totalPages: 1 });

    await getBusinesses(req, res);

    expect(getAllBusinesses).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: businesses,
      totalBusinesses: 2,
      totalPages: 1,
    });
  });

  it('should throw unauthorized error for getBusinesses when user is missing', async () => {
    req.user = null;

    await expect(getBusinesses(req, res)).rejects.toThrow('User is not authorized');
  });

  it('should return business by id', async () => {
    const business = { _id: req.params.id, name: 'Reyhan Restaurant' };
    getBusinessById.mockResolvedValue(business);

    await getBusiness(req, res);

    expect(getBusinessById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: business,
    });
  });

  it('should throw not found when business does not exist', async () => {
    getBusinessById.mockResolvedValue(null);

    await expect(getBusiness(req, res)).rejects.toThrow('Business not found');
  });
});
