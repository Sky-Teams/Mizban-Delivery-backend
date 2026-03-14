import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import {
  addBusiness,
  modifyBusiness,
  getBusiness,
  getBusinesses,
} from '#modules/businesses/controllers/v1/business.controller.js';
import {
  addNewBusiness,
  modifyExistedBusiness,
  getAllBusinesses,
  getBusinessById,
} from '#modules/businesses/services/v1/business.service.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  addNewBusiness: vi.fn(),
  modifyExistedBusiness: vi.fn(),
  getAllBusinesses: vi.fn(),
  getBusinessById: vi.fn(),
}));

describe('Business Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      body: {
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: {
          type: 'Point',
          coordinates: [62.2, 34.35],
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

  describe('addBusiness - admin', () => {
    it('should create business and success response', async () => {
      const mockBusiness = {
        _id: 'businessId',
        owner: 'user1',
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: {
          type: 'Point',
          coordinates: [34.35, 62.2],
        },
        phone: '0093781234567',
        prepTimeAvgMinutes: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addNewBusiness.mockResolvedValue(mockBusiness);

      await addBusiness(req, res);

      expect(addNewBusiness).toHaveBeenCalledWith(req.body);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBusiness,
      });
    });
  });

  describe('modifyBusiness - admin', () => {
    it('should throw unauthorized if req.user is missing', async () => {
      req.user = null;

      await expect(modifyBusiness(req, res)).rejects.toMatchObject({
        message: 'User is not authorized',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('should update successfully', async () => {
      req = {
        params: { id: 'businessId' },
        body: { name: 'new name', type: 'shop' },
        user: { _id: 'user1' },
      };
      const mockBusiness = {
        owner: 'user1',
        _id: 'businessId',
        name: 'new name',
        type: 'shop',
      };

      modifyExistedBusiness.mockResolvedValue(mockBusiness);

      await modifyBusiness(req, res);

      expect(modifyExistedBusiness).toHaveBeenCalledWith(req.params.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBusiness });
    });
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
