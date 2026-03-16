import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assignDriver,
  assignDriverToDeliveryRequest,
  cancelDeliveryRequest,
  cancelOrder,
  createDelivery,
  createDeliveryRequest,
  deliverDeliveryRequest,
  deliverOrder,
  pickupDeliveryRequest,
  pickupOrder,
  updateDeliveryRequest,
  updateDeliveryRequestInfo,
} from '#modules/deliveryRequests/index.js';
import { notFound } from '#shared/errors/error.js';

// Mock the service
vi.mock('#modules/deliveryRequests/services/v1/deliveryRequest.service.js', () => ({
  createDeliveryRequest: vi.fn(),
  updateDeliveryRequestInfo: vi.fn(),
  assignDriverToDeliveryRequest: vi.fn(),
  pickupDeliveryRequest: vi.fn(),
  deliverDeliveryRequest: vi.fn(),
  cancelDeliveryRequest: vi.fn(),
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

describe('Controller Delivery - updateDeliveryRequest', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      params: { id: 'delivery123' },
      body: { status: 'assigned' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(updateDeliveryRequest(req, res)).rejects.toThrow();
  });

  it('should call service and return 200 response with updated delivery request', async () => {
    const mockUpdatedDelivery = { _id: 'delivery123', status: 'assigned' };
    updateDeliveryRequestInfo.mockResolvedValue(mockUpdatedDelivery);

    await updateDeliveryRequest(req, res);

    expect(updateDeliveryRequestInfo).toHaveBeenCalledWith(req.params.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('DB failed');
    updateDeliveryRequestInfo.mockRejectedValue(error);

    await expect(updateDeliveryRequest(req, res)).rejects.toThrow('DB failed');
  });

  it('should update delivery request with partial fields', async () => {
    req.body = { status: 'pickedUp' }; // partial update
    const mockUpdatedDelivery = { _id: 'delivery123', status: 'pickedUp' };
    updateDeliveryRequestInfo.mockResolvedValue(mockUpdatedDelivery);

    await updateDeliveryRequest(req, res);

    expect(updateDeliveryRequestInfo).toHaveBeenCalledWith(req.params.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedDelivery,
    });
  });
});

describe('Controller Delivery - assignDriver', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      params: { id: 'delivery123' },
      body: { driverId: 'driver456' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(assignDriver(req, res)).rejects.toThrow();
  });

  it('should assign driver and return 200 response', async () => {
    const mockDelivery = { _id: 'delivery123', driverId: 'driver456', status: 'assigned' };
    assignDriverToDeliveryRequest.mockResolvedValue(mockDelivery);

    await assignDriver(req, res);

    expect(assignDriverToDeliveryRequest).toHaveBeenCalledWith(req.params.id, req.body.driverId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Driver not idle');
    assignDriverToDeliveryRequest.mockRejectedValue(error);

    await expect(assignDriver(req, res)).rejects.toThrow('Driver not idle');
  });

  it('should assign driver with a different driverId', async () => {
    req.body.driverId = 'driver789';
    const mockDelivery = { _id: 'delivery123', driverId: 'driver789', status: 'assigned' };
    assignDriverToDeliveryRequest.mockResolvedValue(mockDelivery);

    await assignDriver(req, res);

    expect(assignDriverToDeliveryRequest).toHaveBeenCalledWith(req.params.id, 'driver789');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });
});

describe('Controller Delivery - pickupOrder', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      params: { id: 'delivery123' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(pickupOrder(req, res)).rejects.toThrow();
  });

  it('should pick up delivery and return 200 response', async () => {
    const mockDelivery = {
      _id: 'delivery123',
      status: 'pickedUp',
      timeline: { pickedUpAt: new Date() },
    };
    pickupDeliveryRequest.mockResolvedValue(mockDelivery);

    await pickupOrder(req, res);

    expect(pickupDeliveryRequest).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Pickup not allowed');
    pickupDeliveryRequest.mockRejectedValue(error);

    await expect(pickupOrder(req, res)).rejects.toThrow('Pickup not allowed');
  });

  it('should ensure delivery status is updated to pickedUp', async () => {
    const now = new Date();
    const mockDelivery = { _id: 'delivery123', status: 'pickedUp', timeline: { pickedUpAt: now } };
    pickupDeliveryRequest.mockResolvedValue(mockDelivery);

    await pickupOrder(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        status: 'pickedUp',
        timeline: expect.objectContaining({ pickedUpAt: now }),
      }),
    });
  });
});

describe('Controller Delivery - deliverOrder', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      params: { id: 'delivery123' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(deliverOrder(req, res)).rejects.toThrow();
  });

  it('should deliver order and return 200 response', async () => {
    const mockDelivery = {
      _id: 'delivery123',
      status: 'delivered',
      paymentStatus: 'paid',
    };

    deliverDeliveryRequest.mockResolvedValue(mockDelivery);

    await deliverOrder(req, res);

    expect(deliverDeliveryRequest).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Delivery failed');
    deliverDeliveryRequest.mockRejectedValue(error);

    await expect(deliverOrder(req, res)).rejects.toThrow('Delivery failed');
  });

  it('should return delivered status in response', async () => {
    const mockDelivery = {
      _id: 'delivery123',
      status: 'delivered',
      timeline: { deliveredAt: new Date() },
    };

    deliverDeliveryRequest.mockResolvedValue(mockDelivery);

    await deliverOrder(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        status: 'delivered',
      }),
    });
  });
});

describe('Controller Delivery - cancelOrder', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { _id: 'user1' },
      params: { id: 'delivery123' },
      body: { cancelReason: 'Customer requested cancellation' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    await expect(cancelOrder(req, res)).rejects.toThrow();
  });

  it('should cancel order and return 200 response', async () => {
    const mockDelivery = {
      _id: 'delivery123',
      status: 'cancelled',
      cancelReason: 'Customer requested cancellation',
    };

    cancelDeliveryRequest.mockResolvedValue(mockDelivery);

    await cancelOrder(req, res);

    expect(cancelDeliveryRequest).toHaveBeenCalledWith(req.params.id, req.body.cancelReason);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Cancel not allowed');
    cancelDeliveryRequest.mockRejectedValue(error);

    await expect(cancelOrder(req, res)).rejects.toThrow('Cancel not allowed');
  });

  it('should cancel order even if cancelReason is undefined', async () => {
    req.body = {};

    const mockDelivery = {
      _id: 'delivery123',
      status: 'cancelled',
      cancelReason: null,
    };

    cancelDeliveryRequest.mockResolvedValue(mockDelivery);

    await cancelOrder(req, res);

    expect(cancelDeliveryRequest).toHaveBeenCalledWith(req.params.id, undefined);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });
});
