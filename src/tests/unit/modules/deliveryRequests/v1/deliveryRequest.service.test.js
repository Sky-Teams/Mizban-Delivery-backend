import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doesDriverExistByDriverId } from '#modules/drivers/index.js';
import { notFound } from '#shared/errors/error.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import { createDeliveryRequest, DeliveryRequestModel } from '#modules/deliveryRequests/index.js';

vi.mock('#modules/deliveryRequests/models/deliveryRequest.model.js', () => ({
  DeliveryRequestModel: {
    create: vi.fn(),
  },
}));

vi.mock('#modules/drivers/index.js', () => ({
  doesDriverExistByDriverId: vi.fn(),
}));

vi.mock('#shared/utils/math.helper.js', () => ({
  calculateItemsTotal: vi.fn((items) =>
    items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }))
  ),
}));

describe('DeliveryRequest Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseData = {
    type: 'parcel',
    sender: { name: 'Alice', phone: '123' },
    receiver: {
      name: 'Bob',
      phone: '456',
      address: 'Herat',
    },
    pickupLocation: { type: 'Point', coordinates: [0, 0] },
    dropoffLocation: { type: 'Point', coordinates: [1, 1] },
    paymentType: 'COD',
    amountToCollect: 100,
    deliveryPrice: { total: 20 },
  };

  it('should create a delivery request with status "created"', async () => {
    const mockDeliveryRequest = {
      ...baseData,
      _id: '1',
      finalPrice: 120,
      status: 'created',
      timeline: {},
    };
    DeliveryRequestModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await createDeliveryRequest(baseData);

    expect(DeliveryRequestModel.create).toHaveBeenCalledWith({
      ...baseData,
      finalPrice: 120,
      status: 'created',
      timeline: {},
    });
    expect(result).toEqual(mockDeliveryRequest);
  });

  it('should assign driver if driverId exists and set status "assigned"', async () => {
    const data = { ...baseData, driverId: 'driver123' };

    doesDriverExistByDriverId.mockResolvedValue(true);

    const mockDeliveryRequest = {
      ...data,
      _id: '1',
      finalPrice: 120,
      status: 'assigned',
      timeline: { assignedAt: new Date() },
    };
    DeliveryRequestModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await createDeliveryRequest(data);

    expect(doesDriverExistByDriverId).toHaveBeenCalledWith('driver123');
    expect(DeliveryRequestModel.create).toHaveBeenCalledWith({
      ...data,
      finalPrice: 120,
      status: 'assigned',
      timeline: expect.objectContaining({ assignedAt: expect.any(Date) }),
    });
    expect(result).toEqual(mockDeliveryRequest);
  });

  it('should calculate items total if items exist', async () => {
    const items = [
      { name: 'Item A', quantity: 2, unitPrice: 10 },
      { name: 'Item B', quantity: 3, unitPrice: 5 },
    ];

    const data = { ...baseData, items };

    doesDriverExistByDriverId.mockResolvedValue(false);
    DeliveryRequestModel.create.mockImplementation(async (obj) => obj);

    const result = await createDeliveryRequest(data);

    expect(result.items[0].total).toBe(20);
    expect(result.items[1].total).toBe(15);

    expect(calculateItemsTotal).toHaveBeenCalledWith(items);
  });

  it('should throw notFound error if driver does not exist', async () => {
    const data = { ...baseData, driverId: 'driver123' };

    doesDriverExistByDriverId.mockResolvedValue(false);

    await expect(createDeliveryRequest(data)).rejects.toThrow(notFound('Driver'));
  });

  it('should handle optional fields correctly', async () => {
    const data = { ...baseData };
    delete data.amountToCollect;
    delete data.deliveryPrice;

    const mockDeliveryRequest = {
      ...data,
      _id: '1',
      finalPrice: 0,
      status: 'created',
      timeline: {},
    };
    DeliveryRequestModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await createDeliveryRequest(data);

    expect(result).toEqual(mockDeliveryRequest);
  });
});
