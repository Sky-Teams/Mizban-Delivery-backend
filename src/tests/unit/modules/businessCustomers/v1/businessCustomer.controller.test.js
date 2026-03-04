import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBusinessCustomer } from '#modules/businessCustomers/controllers/v1/businessCustomer.controller.js';
import {
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
} from '#modules/businessCustomers/services/v1/businessCustomer.service.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/businessCustomers/services/v1/businessCustomer.service.js', () => ({
  createNewBusinessCustomer: vi.fn(),
  doesBusinessCustomerExist: vi.fn(),
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
