import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBusinessCustomer,
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
  getAllBusinessCustomer,
  getBusinessCustomers,
} from '#modules/businessCustomers/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/businessCustomers/services/v1/businessCustomer.service.js', () => ({
  createNewBusinessCustomer: vi.fn(),
  doesBusinessCustomerExist: vi.fn(),
  getAllBusinessCustomer: vi.fn(),
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

describe('getAllBusinessCustomer', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 5, sort: 'newest' },
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

  it('should return business customers lists sorted by newest', async () => {
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

    expect(getAllBusinessCustomer).toHaveBeenCalledWith(1, 5, 'newest');
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

    expect(getAllBusinessCustomer).toHaveBeenCalledWith(1, 5, 'top');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBusinessCustomer.businessCustomers,
      totalPage: 2,
      totalBusinessCustomers: 10,
    });
  });
});
