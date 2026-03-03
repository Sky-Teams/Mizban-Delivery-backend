import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessModel, isOwner, updateBusinessService } from '#modules/businesses/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

vi.mock('#modules/businesses/models/business.model.js', () => ({
  BusinessModel: {
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe('Business Service - Partial Update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isowner, BusinessModel.findById', async () => {
    it('should return true if user is owner of the business', async () => {
      const userId = 'user1';
      const mockBusiness = { owner: 'user1', _id: '1', name: 'Reyhan Resturant' };

      BusinessModel.findById.mockResolvedValue(mockBusiness);

      const result = await isOwner(userId, mockBusiness.owner);

      expect(result).toBe(true);
    });

    it('should return false if user is not owner of the business', async () => {
      const userId = 'user1';
      const mockBusiness = { owner: 'user2', _id: '1', name: 'Reyhan Resturant' };

      BusinessModel.findById.mockResolvedValue(mockBusiness);
      const result = await isOwner(userId, mockBusiness._id);

      expect(result).toBe(false);
    });

    it('should throw error if business not found', async () => {
      const userId = 'user1';

      BusinessModel.findById.mockResolvedValue(null);

      expect(isOwner(userId, null)).rejects.toMatchObject({
        status: 404,
        message: 'Business not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    });
  });

  describe('updateBusinessService', () => {
    it('should update business successfully (partial)', async () => {
      const userId = 'user1';
      const businessId = '1';
      const businessData = { name: 'Mizban Shop', type: 'other' };
      const mockBusiness = { _id: '1', owner: 'user1', name: 'Mizban Shop', type: 'other' };

      BusinessModel.findOneAndUpdate.mockResolvedValue(mockBusiness);

      const result = await updateBusinessService(userId, businessId, businessData);

      expect(result).toEqual(mockBusiness);
      expect(BusinessModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: businessId, owner: userId },
        { $set: businessData },
        { new: true, runValidators: true }
      );
    });

    it('should throw error if no fields are provided', async () => {
      const userId = 'user1';
      const businessId = '2';
      const businessData = {};

      expect(updateBusinessService(userId, businessId, businessData)).rejects.toMatchObject({
        message: 'No fields provided for update',
        code: ERROR_CODES.NO_FIELDS_PROVIDED,
        status: 400,
      });
    });

    it('should throw error if business not found', async () => {
      const userId = 'user3';
      const businessId = '1';
      const businessData = { type: 'shop' };

      BusinessModel.findOneAndUpdate.mockResolvedValue(null);

      expect(updateBusinessService(userId, businessId, businessData)).rejects.toMatchObject({
        message: 'Business not found',
        code: ERROR_CODES.NOT_FOUND,
        status: 404,
      });
    });
  });
});
