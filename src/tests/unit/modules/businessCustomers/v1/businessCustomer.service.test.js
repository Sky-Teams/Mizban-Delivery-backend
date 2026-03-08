import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createNewBusinessCustomer,
  doesBusinessCustomerExist,
} from '#modules/businessCustomers/services/v1/businessCustomer.service.js';
import { businessCustomerModel } from '#modules/businessCustomers/models/businessCustomer.model.js';

vi.mock('#modules/businessCustomers/models/businessCustomer.model.js', () => ({
  businessCustomerModel: {
    exists: vi.fn(),
    create: vi.fn(),
  },
}));

describe('BusinessCustomer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('doesBusinessCustomerExist', () => {
    it('returns true when customer exists for business and phone or email', async () => {
      businessCustomerModel.exists.mockResolvedValue(true);

      const result = await doesBusinessCustomerExist('business1', '0797123456', 'mahdi@example.com');

      expect(businessCustomerModel.exists).toHaveBeenCalledWith({
        business: 'business1',
        $or: [{ phone: '0797123456' }, { email: 'mahdi@example.com' }],
      });
      expect(result).toBe(true);
    });

    it('returns false when customer does not exist', async () => {
      businessCustomerModel.exists.mockResolvedValue(false);

      const result = await doesBusinessCustomerExist('business1', '0797123456', 'mahdi@example.com');

      expect(result).toBe(false);
    });
  });

  describe('createNewBusinessCustomer', () => {
    it('creates customer using businessId as business and ignores lastOrderAt from input', async () => {
      const bodyData = {
        businessId: '507f1f77bcf86cd799439011',
        name: 'Mahdi',
        phone: '0797123456',
        altPhone: '0797000000',
        email: 'mahdi@example.com',
        addressText: 'Kabul, street 1',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
        notes: 'VIP',
        tags: ['vip'],
        lastOrderAt: new Date('2026-01-01T10:00:00.000Z'),
      };

      const createdDoc = {
        _id: 'cust1',
        ...bodyData,
        business: bodyData.businessId,
      };
      businessCustomerModel.create.mockResolvedValue(createdDoc);

      const result = await createNewBusinessCustomer(bodyData);

      expect(businessCustomerModel.create).toHaveBeenCalledWith({
        business: '507f1f77bcf86cd799439011',
        name: 'Mahdi',
        phone: '0797123456',
        altPhone: '0797000000',
        email: 'mahdi@example.com',
        addressText: 'Kabul, street 1',
        location: { type: 'Point', coordinates: [69.2, 34.5] },
        notes: 'VIP',
        tags: ['vip'],
      });
      expect(result).toEqual(createdDoc);
    });
  });
});
