import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBusinessCustomer,
  updateBusinessCustomer,
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
  getAllBusinessCustomer,
  getBusinessCustomers,
  findBusinessCustomerById,
  updateExistedBusinessCustomer,
} from '#modules/businessCustomers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/businessCustomers/services/v1/businessCustomer.service.js', () => ({
  createNewBusinessCustomer: vi.fn(),
  doesBusinessCustomerExist: vi.fn(),
  getAllBusinessCustomer: vi.fn(),
  findBusinessCustomerById: vi.fn(),
  updateExistedBusinessCustomer: vi.fn(),
}));

describe('BusinessCustomer controller - createBusinessCustomer', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'business1' },
      body: {
        businessId: '507f1f77bcf86cd799439011',
        name: 'Mahdi',
        phone: '0797123456',
        email: 'mahdi@example.com',
        addressText: 'Kabul',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('throws unauthorized error when req.user is missing', async () => {
    req.user = null;

    await expect(createBusinessCustomer(req, res)).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'User is not authorized',
    });
  });

  it('throws duplicate error when customer already exists', async () => {
    doesBusinessCustomerExist.mockResolvedValue(true);

    await expect(createBusinessCustomer(req, res)).rejects.toThrow(AppError);
    await expect(createBusinessCustomer(req, res)).rejects.toMatchObject({
      code: ERROR_CODES.BUSINESS_CUSTOMER_ALREADY_EXIST,
      message: 'Business customer already exists',
    });

    expect(doesBusinessCustomerExist).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '0797123456',
      'mahdi@example.com'
    );
    expect(createNewBusinessCustomer).not.toHaveBeenCalled();
  });

  it('creates business customer and returns 201', async () => {
    const created = { _id: 'cust1', business: req.body.businessId, ...req.body };
    doesBusinessCustomerExist.mockResolvedValue(false);
    createNewBusinessCustomer.mockResolvedValue(created);

    await createBusinessCustomer(req, res);

    expect(doesBusinessCustomerExist).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '0797123456',
      'mahdi@example.com'
    );
    expect(createNewBusinessCustomer).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: created,
    });
  });
});

describe('BusinessCustomer controller - updateBusinessCustomer', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
  
    req = {
      user: { _id: 'business1' },
      params: { id: 'customer1' },
      body: {
        name: 'Updated Name',
        notes: 'updated note',
        isActive: false,
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('throws unauthorized error when req.user is missing', async () => {
    req.user = null;

    await expect(updateBusinessCustomer(req, res)).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'User is not authorized',
    });
  });

  it('updates business customer and returns 200', async () => {
    const updated = {
      _id: 'customer1',
      business: 'business1',
      ...req.body,
    };
    findBusinessCustomerById.mockResolvedValue({ _id: 'customer1', business: 'business1' });
    updateExistedBusinessCustomer.mockResolvedValue(updated);

    await updateBusinessCustomer(req, res);

    expect(findBusinessCustomerById).toHaveBeenCalledWith('customer1');
    expect(updateExistedBusinessCustomer).toHaveBeenCalledWith('customer1', 'business1', req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updated,
    });
  });

  it('throws NOT_FOUND when customer does not exist', async () => {
    findBusinessCustomerById.mockResolvedValue(null);

    await expect(updateBusinessCustomer(req, res)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      message: 'Customer not found',
    });

    expect(updateExistedBusinessCustomer).not.toHaveBeenCalled();
  });

  it('propagates error from service layer', async () => {
    const error = new AppError('BusinessCustomer not found', 404, ERROR_CODES.NOT_FOUND);
    findBusinessCustomerById.mockResolvedValue({ _id: 'customer1', business: 'business1' });
    updateExistedBusinessCustomer.mockRejectedValue(error);

    await expect(updateBusinessCustomer(req, res)).rejects.toThrow(AppError);
    await expect(updateBusinessCustomer(req, res)).rejects.toMatchObject({
      message: 'BusinessCustomer not found',
      code: ERROR_CODES.NOT_FOUND,
    });
  });
});

describe('getAllBusinessCustomer', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 5, sort: 'latest' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(getBusinessCustomers(req, res)).rejects.toThrow(AppError);
  });

  it('should return business customers lists sorted by latest', async () => {
    const mockBusinessCustomer = {
      businessCustomers: [
        { _id: '3', createdAt: '2026-03-05' },
        { _id: '2', createdAt: '2026-03-03' },
        { _id: '1', createdAt: '2026-03-02' },
      ],
      totalBusinessCustomers: 10,
      totalPage: 2,
    };

    getAllBusinessCustomer.mockResolvedValue(mockBusinessCustomer);

    await getBusinessCustomers(req, res);

    expect(getAllBusinessCustomer).toHaveBeenCalledWith(1, 5, { sort: 'latest' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBusinessCustomer.businessCustomers,
      totalPage: 2,
      totalBusinessCustomers: 10,
    });
  });

  it('should return business customers lists sorted by totalOrders', async () => {
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 5, sort: 'top' },
    };
    const mockBusinessCustomer = {
      businessCustomers: [
        { _id: '1', totalOrders: 10 },
        { _id: '2', totalOrders: 5 },
        { _id: '3', totaOrders: 1 },
      ],
      totalBusinessCustomers: 10,
      totalPage: 2,
    };

    getAllBusinessCustomer.mockResolvedValue(mockBusinessCustomer);

    await getBusinessCustomers(req, res);

    expect(getAllBusinessCustomer).toHaveBeenCalledWith(1, 5, { sort: 'top' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBusinessCustomer.businessCustomers,
      totalPage: 2,
      totalBusinessCustomers: 10,
    });
  });

  it('should return business customers lists isActive = true', async () => {
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 2, isActive: true },
    };
    const mockBusinessCustomer = {
      businessCustomers: [
        { _id: '1', isActive: true },
        { _id: '2', isActive: true },
        { _id: '3', isActive: true },
      ],
      totalBusinessCustomers: 10,
      totalPage: 5,
    };

    getAllBusinessCustomer.mockResolvedValue(mockBusinessCustomer);

    await getBusinessCustomers(req, res);

    expect(getAllBusinessCustomer).toHaveBeenCalledWith(1, 2, { isActive: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBusinessCustomer.businessCustomers,
      totalPage: 5,
      totalBusinessCustomers: 10,
    });
  });
});
