import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBusiness, createNewBusiness } from '#modules/businesses/index.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  createNewBusiness: vi.fn(),
}));

describe('Controller Business - create business ', () => {
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
