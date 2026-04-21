import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assignDriver,
  assignDriverToOrderWithTransaction,
  cancelOrderWithTransaction,
  cancelOrder,
  createOrder,
  addOrder,
  deliverOrderWithTransaction,
  deliverOrder,
  pickupOrderWithTransaction,
  pickupOrder,
  updateOrder,
  updateOrderInfo,
  getOrders,
  getAllOrders,
  getOrder,
  getOrderById,
} from '#modules/orders/index.js';
import { AppError, notFound } from '#shared/errors/error.js';

// Mock the service
vi.mock('#modules/orders/services/v1/order.service.js', () => ({
  addOrder: vi.fn(),
  updateOrderInfo: vi.fn(),
  assignDriverToOrderWithTransaction: vi.fn(),
  pickupOrderWithTransaction: vi.fn(),
  deliverOrderWithTransaction: vi.fn(),
  cancelOrderWithTransaction: vi.fn(),
  getAllOrders: vi.fn(),
  getOrderById: vi.fn(),
}));

describe('Controller Order - create order', () => {
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

    await expect(createOrder(req, res)).rejects.toThrow();
  });

  it('should create order and return 201 response', async () => {
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

    addOrder.mockResolvedValue(mockDeliveryRequest);

    await createOrder(req, res);

    expect(addOrder).toHaveBeenCalledWith(req.body);
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

    addOrder.mockResolvedValue(mockDeliveryRequest);

    await createOrder(req, res);

    expect(addOrder).toHaveBeenCalledWith(req.body);
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

    addOrder.mockResolvedValue(mockDeliveryRequest);

    await createOrder(req, res);

    expect(addOrder).toHaveBeenCalledWith(req.body);
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
    addOrder.mockRejectedValue(error);

    await expect(createOrder(req, res)).rejects.toThrow('Driver not found');
  });

  it('should propagate error from service', async () => {
    const error = new Error('DB failed');
    addOrder.mockRejectedValue(error);

    await expect(createOrder(req, res)).rejects.toThrow('DB failed');
  });
});

describe('Controller Order - updateOrder', () => {
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

    await expect(updateOrder(req, res)).rejects.toThrow();
  });

  it('should call service and return 200 response with updated order', async () => {
    const mockUpdatedDelivery = { _id: 'delivery123', status: 'assigned' };
    updateOrderInfo.mockResolvedValue(mockUpdatedDelivery);

    await updateOrder(req, res);

    expect(updateOrderInfo).toHaveBeenCalledWith(req.params.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('DB failed');
    updateOrderInfo.mockRejectedValue(error);

    await expect(updateOrder(req, res)).rejects.toThrow('DB failed');
  });

  it('should update order with partial fields', async () => {
    req.body = { status: 'pickedUp' }; // partial update
    const mockUpdatedDelivery = { _id: 'delivery123', status: 'pickedUp' };
    updateOrderInfo.mockResolvedValue(mockUpdatedDelivery);

    await updateOrder(req, res);

    expect(updateOrderInfo).toHaveBeenCalledWith(req.params.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedDelivery,
    });
  });
});

describe('Controller Order - assignDriver', () => {
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
    assignDriverToOrderWithTransaction.mockResolvedValue(mockDelivery);

    await assignDriver(req, res);

    expect(assignDriverToOrderWithTransaction).toHaveBeenCalledWith(
      req.params.id,
      req.body.driverId
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Driver not idle');
    assignDriverToOrderWithTransaction.mockRejectedValue(error);

    await expect(assignDriver(req, res)).rejects.toThrow('Driver not idle');
  });

  it('should assign driver with a different driverId', async () => {
    req.body.driverId = 'driver789';
    const mockDelivery = { _id: 'delivery123', driverId: 'driver789', status: 'assigned' };
    assignDriverToOrderWithTransaction.mockResolvedValue(mockDelivery);

    await assignDriver(req, res);

    expect(assignDriverToOrderWithTransaction).toHaveBeenCalledWith(req.params.id, 'driver789');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });
});

describe('Controller Order - pickupOrder', () => {
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
    pickupOrderWithTransaction.mockResolvedValue(mockDelivery);

    await pickupOrder(req, res);

    expect(pickupOrderWithTransaction).toHaveBeenCalledWith(req.params.id, req.user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Pickup not allowed');
    pickupOrderWithTransaction.mockRejectedValue(error);

    await expect(pickupOrder(req, res)).rejects.toThrow('Pickup not allowed');
  });

  it('should ensure delivery status is updated to pickedUp', async () => {
    const now = new Date();
    const mockDelivery = { _id: 'delivery123', status: 'pickedUp', timeline: { pickedUpAt: now } };
    pickupOrderWithTransaction.mockResolvedValue(mockDelivery);

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

describe('Controller Order - deliverOrder', () => {
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

    deliverOrderWithTransaction.mockResolvedValue(mockDelivery);

    await deliverOrder(req, res);

    expect(deliverOrderWithTransaction).toHaveBeenCalledWith(req.params.id, req.user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Order failed');
    deliverOrderWithTransaction.mockRejectedValue(error);

    await expect(deliverOrder(req, res)).rejects.toThrow('Order failed');
  });

  it('should return delivered status in response', async () => {
    const mockDelivery = {
      _id: 'delivery123',
      status: 'delivered',
      timeline: { deliveredAt: new Date() },
    };

    deliverOrderWithTransaction.mockResolvedValue(mockDelivery);

    await deliverOrder(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        status: 'delivered',
      }),
    });
  });
});

describe('Controller Order - cancelOrder', () => {
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

    cancelOrderWithTransaction.mockResolvedValue(mockDelivery);

    await cancelOrder(req, res);

    expect(cancelOrderWithTransaction).toHaveBeenCalledWith(
      req.params.id,
      req.body.cancelReason,
      req.user
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });

  it('should propagate error from service', async () => {
    const error = new Error('Cancel not allowed');
    cancelOrderWithTransaction.mockRejectedValue(error);

    await expect(cancelOrder(req, res)).rejects.toThrow('Cancel not allowed');
  });

  it('should cancel order even if cancelReason is undefined', async () => {
    req.body = {};

    const mockDelivery = {
      _id: 'delivery123',
      status: 'cancelled',
      cancelReason: null,
    };

    cancelOrderWithTransaction.mockResolvedValue(mockDelivery);

    await cancelOrder(req, res);

    expect(cancelOrderWithTransaction).toHaveBeenCalledWith(req.params.id, undefined, req.user);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockDelivery,
    });
  });
});

describe('Controller Order - getOrders', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 5 },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    expect(getOrders(req, res)).rejects.toThrow(AppError);
  });

  it('should return orders list', async () => {
    const mockOrders = {
      orders: [
        { _id: '3', createdAt: '2026-03-05' },
        { _id: '2', createdAt: '2026-03-03' },
        { _id: '1', createdAt: '2026-03-02' },
      ],
      totalOrders: 10,
      totalPage: 2,
    };

    getAllOrders.mockResolvedValue(mockOrders);

    await getOrders(req, res);

    expect(getAllOrders).toHaveBeenCalledWith(1, 5, {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockOrders.orders,
      totalPage: 2,
      totalOrders: 10,
    });
  });

  it('should return orders list by status: created', async () => {
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 5, status: 'created' },
    };
    const mockOrders = {
      orders: [
        { _id: '1', status: 'created' },
        { _id: '2', status: 'created' },
        { _id: '3', status: 'created' },
      ],
      totalOrders: 10,
      totalPage: 2,
    };

    getAllOrders.mockResolvedValue(mockOrders);

    await getOrders(req, res);

    expect(getAllOrders).toHaveBeenCalledWith(1, 5, { status: 'created' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockOrders.orders,
      totalPage: 2,
      totalOrders: 10,
    });
  });

  it('should return orders list priority = high', async () => {
    req = {
      user: { _id: 'user123' },
      query: { page: 1, limit: 2, priority: 'high' },
    };
    const mockOrders = {
      orders: [
        { _id: '1', priority: 'high' },
        { _id: '2', priority: 'high' },
        { _id: '3', priority: 'high' },
      ],
      totalOrders: 10,
      totalPage: 5,
    };

    getAllOrders.mockResolvedValue(mockOrders);

    await getOrders(req, res);

    expect(getAllOrders).toHaveBeenCalledWith(1, 2, { priority: 'high' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockOrders.orders,
      totalPage: 5,
      totalOrders: 10,
    });
  });
});

describe('Controller Order - getOrder (By Id)', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user123' },
      params: { id: 1 },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized error if user is missing', async () => {
    req.user = null;

    expect(getOrder(req, res)).rejects.toThrow(AppError);
  });

  it('should return order list by id', async () => {
    const mockOrder = { _id: '1', status: 'created', priority: 'high' };

    getOrderById.mockResolvedValue(mockOrder);

    await getOrder(req, res);

    expect(getOrderById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockOrder,
    });
  });
});
