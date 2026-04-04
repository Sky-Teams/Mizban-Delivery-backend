import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { hashPassword } from '#shared/utils/jwt.js';
import { UserModel } from '#modules/users/index.js';
import { BusinessModel } from '#modules/businesses/models/business.model.js';
import { filterUserField } from '#shared/utils/queryBuilder.js';
import {
  addNewBusiness,
  getAllBusinesses,
  getBusinessById,
  modifyExistedBusiness,
} from '#modules/businesses/services/v1/business.service.js';

vi.mock('#modules/businesses/models/business.model.js', () => ({
  BusinessModel: {
    exists: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#shared/utils/jwt.js', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('#shared/utils/queryBuilder.js', () => ({
  filterUserField: vi.fn(),
}));

const fakeSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

vi.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession);

describe('Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBusinesses', () => {
    it('returns paginated businesses and totals', async () => {
      const businesses = [{ _id: '1', name: 'Business A' }];
      const lean = vi.fn().mockResolvedValue(businesses);
      const populate = vi.fn().mockReturnValue({ lean });
      const limit = vi.fn().mockReturnValue({ populate });
      const skip = vi.fn().mockReturnValue({ limit });

      BusinessModel.find.mockReturnValue({ skip });
      BusinessModel.countDocuments.mockResolvedValue(1);

      const result = await getAllBusinesses();

      expect(BusinessModel.find).toHaveBeenCalledWith({});
      expect(skip).toHaveBeenCalledWith(0);
      expect(limit).toHaveBeenCalledWith(8);
      expect(populate).toHaveBeenCalledWith('owner', 'name email');
      expect(BusinessModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({ businesses, totalBusinesses: 1, totalPages: 1 });
    });
  });

  describe('getBusinessById', () => {
    it('returns a business by id', async () => {
      const business = { _id: 'business-id', name: 'Business One' };
      const populate = vi.fn().mockResolvedValue(business);
      BusinessModel.findById.mockReturnValue({ populate });

      const result = await getBusinessById('business-id');

      expect(BusinessModel.findById).toHaveBeenCalledWith('business-id');
      expect(populate).toHaveBeenCalledWith('owner', 'name email');
      expect(result).toEqual(business);
    });

    it('returns null when business is not found', async () => {
      const populate = vi.fn().mockResolvedValue(null);
      BusinessModel.findById.mockReturnValue({ populate });

      const result = await getBusinessById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('Admin services', () => {
    it('addNewBusiness creates business and commits transaction', async () => {
      const businessData = {
        username: 'test',
        email: 'test@example.com',
        userPhoneNumber: '0781234567',
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
        phone: '0093781234567',
        prepTimeAvgMinutes: 30,
      };

      hashPassword.mockResolvedValue('hashedPassword');
      UserModel.create.mockResolvedValue([{ _id: 'user123' }]);
      BusinessModel.create.mockResolvedValue([
        { _id: 'biz1', owner: 'user123', name: 'Reyhan Restaurant' },
      ]);

      const result = await addNewBusiness(businessData);

      expect(hashPassword).toHaveBeenCalledWith('business123');
      expect(UserModel.create).toHaveBeenCalled();
      expect(BusinessModel.create).toHaveBeenCalled();
      expect(result.owner).toBe('user123');
      expect(fakeSession.startTransaction).toHaveBeenCalled();
      expect(fakeSession.commitTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });

    it('modifyExistedBusiness updates business/user and commits transaction', async () => {
      const businessData = {
        userId: 'user123',
        type: 'shop',
        username: 'Updated',
        email: 'test@example.com',
      };

      filterUserField.mockResolvedValue({ name: 'Updated', email: 'test@example.com' });

      BusinessModel.findByIdAndUpdate.mockResolvedValue({
        owner: 'user123',
        toObject: () => ({ _id: 'biz1', type: 'shop' }),
      });
      UserModel.findOneAndUpdate.mockResolvedValue({
        name: 'Updated',
        email: 'test@example.com',
        phone: '123',
      });

      const result = await modifyExistedBusiness('biz1', businessData);

      expect(result).toMatchObject({
        owner: 'user123',
        type: 'shop',
        username: 'Updated',
        email: 'test@example.com',
        userPhoneNumber: '123',
      });
      expect(fakeSession.commitTransaction).toHaveBeenCalled();
      expect(fakeSession.endSession).toHaveBeenCalled();
    });
  });
});

/* unnecessary codes


  describe('createNewBusiness', () => {
    it('creates a new business', async () => {
      const userId = 'user1';
      const businessData = {
        name: 'Reyhan Restaurant',
        type: 'restaurant',
        addressText: 'Afghanistan, Herat',
        location: { type: 'Point', coordinates: [62.2, 34.35] },
        phone: '0093781234567',
        prepTimeAvgMinutes: 30,
      };

      const mockBusiness = { _id: '1', owner: userId, ...businessData };
      BusinessModel.create.mockResolvedValue(mockBusiness);

      const result = await createNewBusiness(userId, businessData);

      expect(result).toEqual(mockBusiness);
      expect(BusinessModel.create).toHaveBeenCalledWith({ ...businessData, owner: userId });
    });

    it('propagates errors from BusinessModel.create', async () => {
      BusinessModel.create.mockRejectedValue(new Error('DB failed'));

      await expect(createNewBusiness('user1', { name: 'x' })).rejects.toThrow('DB failed');
    });
  });

   describe('updateBusinessService', () => {
    it('updates business successfully (partial)', async () => {
      const userId = 'user1';
      const businessId = '1';
      const businessData = { name: 'Mizban Shop', type: 'other' };
      const mockBusiness = { _id: businessId, owner: userId, ...businessData };

      BusinessModel.findOneAndUpdate.mockResolvedValue(mockBusiness);

      const result = await updateBusinessService(userId, businessId, businessData);

      expect(result).toEqual(mockBusiness);
      expect(BusinessModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: businessId, owner: userId },
        { $set: { name: 'Mizban Shop', type: 'other' } },
        { new: true, runValidators: true }
      );
    });

    it('throws error if no fields are provided', async () => {
      await expect(updateBusinessService('user1', '1', {})).rejects.toMatchObject({
        message: 'No fields provided for update',
        code: ERROR_CODES.NO_FIELDS_PROVIDED,
        status: 400,
      });
    });

    it('throws notFound if business does not exist', async () => {
      BusinessModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        updateBusinessService('user1', 'missing', { type: 'shop' })
      ).rejects.toMatchObject({
        message: 'Business not found',
        code: ERROR_CODES.NOT_FOUND,
        status: 404,
      });
    });
  });

  */
