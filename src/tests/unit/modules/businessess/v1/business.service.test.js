import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BusinessModel,
  updateBusinessService,
  createNewBusiness,
  addNewBusiness,
  modifyExistedBusiness,
} from '#modules/businesses/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { UserModel } from '#modules/users/index.js';
import mongoose from 'mongoose';

vi.mock('#modules/businesses/models/business.model.js', () => ({
  BusinessModel: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
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

describe('Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Business Service - CreateNewBusiness', () => {
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

    it('Should create new business', async () => {
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

  describe('Business Service - Partial Update', () => {
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

      await expect(updateBusinessService(userId, businessId, businessData)).rejects.toMatchObject({
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

      await expect(updateBusinessService(userId, businessId, businessData)).rejects.toMatchObject({
        message: 'Business not found',
        code: ERROR_CODES.NOT_FOUND,
        status: 404,
      });
    });
  });

  describe('Admin Service', () => {
    describe('addNewBusiness', () => {
      it('should create a business and commit transaction', async () => {
        const businessData = {
          username: 'test',
          email: 'test@example.com',
          userPhoneNumber: '0781234567',
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

        const mockBusiness = {
          _id: '1',
          owner: 'user123',
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

        hashPassword.mockResolvedValue('hashedPassword');
        UserModel.create.mockResolvedValue([{ _id: 'user123' }]);
        BusinessModel.create.mockResolvedValue([
          {
            ...mockBusiness,
            toObject: () => mockBusiness,
          },
        ]);

        const result = await addNewBusiness(businessData);

        expect(result.owner).toBe('user123');
        expect(fakeSession.startTransaction).toHaveBeenCalled();
        expect(fakeSession.commitTransaction).toHaveBeenCalled();
        expect(fakeSession.endSession).toHaveBeenCalled();
      });
    });

    describe('modifyExistedBusiness', () => {
      it('should update business and user and commit', async () => {
        const businessData = {
          userId: 'user123',
          type: 'shop',
          username: 'Updated',
          email: 'test@example.com',
        };

        const updatedBusinessMock = {
          owner: 'user123',
          toObject: () => ({ _id: 'business1', type: 'shop' }),
        };
        const updatedUserMock = {
          name: 'Updated',
          email: 'test@example.com',
          userPhoneNumber: '123',
        };

        BusinessModel.findByIdAndUpdate.mockResolvedValue(updatedBusinessMock);
        UserModel.findOneAndUpdate.mockResolvedValue(updatedUserMock);

        const result = await modifyExistedBusiness('business1', businessData);

        expect(result.owner).toBe('user123');
        expect(result.type).toBe('shop');
        expect(result.username).toBe('Updated');
        expect(result.email).toBe('test@example.com');
        expect(fakeSession.commitTransaction).toHaveBeenCalled();
        expect(fakeSession.endSession).toHaveBeenCalled();
      });
    });
  });
});
