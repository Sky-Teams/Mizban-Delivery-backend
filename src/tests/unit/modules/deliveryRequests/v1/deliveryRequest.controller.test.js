import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDelivery, createDeliveryRequest } from '#modules/deliveryRequests/index.js';
import { notFound } from '#shared/errors/error.js';

// Mock the service
vi.mock('#modules/deliveryRequests/services/v1/deliveryRequest.service.js', () => ({
  createDeliveryRequest: vi.fn(),
}));

describe('Controller Delivery - create delivery request', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      body: {
        type: 'parcel',
        serviceType: 'immediate',
        sender: { name: 'Alice', phone: '123456' },
        receiver: {
          name: 'Ahmad',
          phone: '0790909090',
          address: 'Herat, Afghanistan',
        },
        pickupLocation: { coordinates: [62.2, 34.35] },
        dropoffLocation: { coordinates: [62.5, 34.4] },
        paymentType: 'COD',
        amountToCollect: 100,
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(createDelivery(req, res)).rejects.toThrow();
  });

  it('should create delivery request and return 201 response', async () => {
    const mockDeliveryRequest = {
      _id: '1',
      type: 'parcel',
      sender: req.body.sender,
      receiver: req.body.receiver,
      pickupLocation: req.body.pickupLocation,
      dropoffLocation: req.body.dropoffLocation,
      paymentType: req.body.paymentType,
      amountToCollect: req.body.amountToCollect,
      finalPrice: 100,
      status: 'created',
      timeline: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    createDeliveryRequest.mockResolvedValue(mockDeliveryRequest);

    await createDelivery(req, res);

    expect(createDeliveryRequest).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDeliveryRequest,
    });
  });

  it('should set status "assigned" and timeline.assignedAt when driverId is provided', async () => {
    req.body.driverId = '62f1a3b8c3a5f4e5a1a1d1c';

    const mockDeliveryRequest = {
      ...req.body,
      _id: '1',
      finalPrice: 100,
      status: 'assigned',
      timeline: { assignedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    createDeliveryRequest.mockResolvedValue(mockDeliveryRequest);

    await createDelivery(req, res);

    expect(createDeliveryRequest).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDeliveryRequest,
    });
    expect(mockDeliveryRequest.status).toBe('assigned');
    expect(mockDeliveryRequest.timeline.assignedAt).toBeDefined();
  });

  it('should calculate items total and finalPrice correctly', async () => {
    req.body.items = [
      { name: 'Item A', quantity: 2, unitPrice: 10 },
      { name: 'Item B', quantity: 3, unitPrice: 5 },
    ];
    req.body.amountToCollect = 50;
    req.body.deliveryPrice = { total: 20 };

    const calculatedItems = [
      { name: 'Item A', quantity: 2, unitPrice: 10, total: 20 },
      { name: 'Item B', quantity: 3, unitPrice: 5, total: 15 },
    ];

    const mockDeliveryRequest = {
      ...req.body,
      items: calculatedItems,
      _id: '1',
      finalPrice: 70, // amountToCollect + deliveryPrice.total
      status: 'created',
      timeline: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    createDeliveryRequest.mockResolvedValue(mockDeliveryRequest);

    await createDelivery(req, res);

    expect(createDeliveryRequest).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDeliveryRequest,
    });

    expect(mockDeliveryRequest.items[0].total).toBe(20);
    expect(mockDeliveryRequest.items[1].total).toBe(15);
    expect(mockDeliveryRequest.finalPrice).toBe(70);
  });

  it('should throw notFound error if driverId is provided but driver does not exist', async () => {
    req.body.driverId = '62f1a3b8c3a5f4e5a1a1d1c';

    const error = notFound('Driver');
    createDeliveryRequest.mockRejectedValue(error);

    await expect(createDelivery(req, res)).rejects.toThrow('Driver not found');
  });

  it('should propagate error from service', async () => {
    const error = new Error('DB failed');
    createDeliveryRequest.mockRejectedValue(error);

    await expect(createDelivery(req, res)).rejects.toThrow('DB failed');
  });
});
