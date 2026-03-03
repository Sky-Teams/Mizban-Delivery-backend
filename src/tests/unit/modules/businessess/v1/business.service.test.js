import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNewBusiness, BusinessModel } from '#modules/businesses/index.js';

vi.mock('#modules/businesses/models/business.model.js', () => ({
  BusinessModel: {
    create: vi.fn(),
  },
}));

describe('Business Service - CreateNewBusiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
