import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import {
  createBusiness,
  createNewBusiness,
  addBusiness,
  addNewBusiness,
  modifyBusiness,
  modifyExistedBusiness,
  updateBusinessService,
  updateBusiness,
} from '#modules/businesses/index.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  createNewBusiness: vi.fn(),
  updateBusinessService: vi.fn(),
  addNewBusiness: vi.fn(),
  modifyExistedBusiness: vi.fn(),
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
    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(createBusiness(req, res)).rejects.toThrow();
    });

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

    it('should propagate error from service ', async () => {
      const error = new Error('DB failed');
      addNewBusiness.mockRejectedValue(error);

      await expect(addBusiness(req, res)).rejects.toThrow('DB failed');
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

  describe('create business ', () => {
    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(createBusiness(req, res)).rejects.toThrow();
    });

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

  describe('updateBusiness', () => {
    it('should throw unauthorized if req.user is missing', async () => {
      req.user = null;

      await expect(updateBusiness(req, res)).rejects.toMatchObject({
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

      updateBusinessService.mockResolvedValue(mockBusiness);

      await updateBusiness(req, res);

      expect(updateBusinessService).toHaveBeenCalledWith(req.user._id, req.params.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBusiness });
    });

    it('should propagate errors from updateBusinessService', async () => {
      const req = { user: { _id: 'user1' }, params: { id: '1' }, body: {} };
      const error = new AppError('No fields provided', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
      updateBusinessService.mockRejectedValue(error);

      await expect(updateBusiness(req, res)).rejects.toBe(error);
      await expect(updateBusiness(req, res)).rejects.toMatchObject({
        message: 'No fields provided',
        code: ERROR_CODES.NO_FIELDS_PROVIDED,
      });
    });
  });
});
