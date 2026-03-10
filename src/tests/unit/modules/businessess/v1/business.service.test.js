import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNewBusiness,
  getAllBusinesses,
  getBusinessById,
} from '#modules/businesses/services/v1/business.service.js';
import { BusinessModel } from '#modules/businesses/models/business.model.js';

vi.mock('#modules/businesses/models/business.model.js', () => ({
  BusinessModel: {
    exists: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

describe('Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNewBusiness', () => {
    const userId = 'user1';

    const businessData = {
      name: 'Reyhan Restaurant',
      type: 'restaurant',
      addressText: 'Afghanistan, Herat',
      location: {
        type: 'Point',
        coordinates: [62.3, 32],
      },
      phone: '0093781234567',
      prepTimeAvgMinutes: 30,
    };

    it('should create new business', async () => {
      const mockBusiness = {
        _id: '1',
        owner: 'user1',
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

      BusinessModel.create.mockResolvedValue(mockBusiness);

      const result = await createNewBusiness(userId, businessData);
      expect(result).toEqual(mockBusiness);
      expect(BusinessModel.create).toHaveBeenCalledWith({ ...businessData, owner: userId });
    });

    it('should propagate error if BusinessModel.create fails', async () => {
      const error = new Error('DB failed');
      BusinessModel.create.mockRejectedValue(error);

      await expect(createNewBusiness(userId, businessData)).rejects.toThrow('DB failed');
    });
  });

  describe('getAllBusinesses', () => {
    it('should return all businesses with owner populated', async () => {
      const businesses = [{ _id: '1', name: 'Business A' }];
      const lean = vi.fn().mockResolvedValue(businesses);
      const populate = vi.fn().mockReturnValue({ lean });
      const limit = vi.fn().mockReturnValue({ populate });
      const skip = vi.fn().mockReturnValue({ limit });

      BusinessModel.countDocuments.mockResolvedValue(1);
      BusinessModel.find.mockReturnValue({ skip });

      const result = await getAllBusinesses();

      expect(BusinessModel.countDocuments).toHaveBeenCalledWith({});
      expect(BusinessModel.find).toHaveBeenCalledWith({});
      expect(skip).toHaveBeenCalledTimes(1);
      expect(limit).toHaveBeenCalledTimes(1);
      expect(populate).toHaveBeenCalledWith('owner', 'name email');
      expect(lean).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ businesses, totalBusinesses: 1, totalPages: 1 });
    });
  });

  describe('getBusinessById', () => {
    it('should return business by id with owner populated', async () => {
      const business = { _id: 'business-id', name: 'Business One' };
      const populate = vi.fn().mockResolvedValue(business);
      BusinessModel.findById.mockReturnValue({ populate });

      const result = await getBusinessById('business-id');

      expect(BusinessModel.findById).toHaveBeenCalledWith('business-id');
      expect(populate).toHaveBeenCalledWith('owner', 'name email');
      expect(result).toEqual(business);
    });

    it('should return null when business is not found by id', async () => {
      const populate = vi.fn().mockResolvedValue(null);
      BusinessModel.findById.mockReturnValue({ populate });

      const result = await getBusinessById('missing-id');

      expect(result).toBeNull();
    });
  });
});
