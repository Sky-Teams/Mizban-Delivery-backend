import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doesDriverExistByDriverId, getDriverStatusByDriverId } from '#modules/drivers/index.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import {
  assignDriverToOrderWithTransaction,
  cancelOrderWithTransaction,
  addOrder,
  deliverOrderWithTransaction,
  OrderModel,
  pickupOrderWithTransaction,
  getAllOrders,
} from '#modules/orders/index.js';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { orderUpdateQuery, driverQueryBuilder } from '#shared/utils/queryBuilder.js';
import { getOrderById, updateOrderInfo } from '#modules/orders/services/v1/order.service.js';

vi.mock('#modules/orders/models/order.model.js', () => ({
  OrderModel: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('#modules/drivers/index.js', () => ({
  doesDriverExistByDriverId: vi.fn(),
  getDriverStatusByDriverId: vi.fn(),
  DriverModel: {
    findById: vi.fn(),
  },
}));

vi.mock('#shared/utils/math.helper.js', () => ({
  calculateItemsTotal: vi.fn((items) =>
    items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }))
  ),
}));

vi.mock('#shared/utils/queryBuilder.js', () => ({
  orderUpdateQuery: vi.fn(),
  driverQueryBuilder: vi.fn(),
}));

const fakeSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

vi.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession);

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

  it('should create a order with status "created"', async () => {
    const mockDeliveryRequest = {
      ...baseData,
      _id: '1',
      finalPrice: 120,
      status: 'created',
      timeline: {},
    };
    OrderModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await addOrder(baseData);

    expect(OrderModel.create).toHaveBeenCalledWith({
      ...baseData,
      finalPrice: 120,
      status: 'created',
      timeline: {},
    });
    expect(result).toEqual(mockDeliveryRequest);
  });

  it('should assign driver if driverId exists and set status "assigned"', async () => {
    const data = { ...baseData, driverId: 'driver123' };

    getDriverStatusByDriverId.mockResolvedValue({ status: 'idle' });

    const mockDeliveryRequest = {
      ...data,
      _id: '1',
      finalPrice: 120,
      status: 'assigned',
      timeline: { assignedAt: new Date() },
    };

    OrderModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await addOrder(data);

    expect(getDriverStatusByDriverId).toHaveBeenCalledWith('driver123');

    expect(OrderModel.create).toHaveBeenCalledWith({
      ...data,
      finalPrice: 120,
      status: 'assigned',
      timeline: expect.objectContaining({
        assignedAt: expect.any(Date),
      }),
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
    OrderModel.create.mockImplementation(async (obj) => obj);

    const result = await addOrder(data);

    expect(result.items[0].total).toBe(20);
    expect(result.items[1].total).toBe(15);

    expect(calculateItemsTotal).toHaveBeenCalledWith(items);
  });

  it('should throw error if driver is not idle', async () => {
    const data = { ...baseData, driverId: 'driver123' };

    getDriverStatusByDriverId.mockResolvedValue({
      status: 'busy',
    });

    await expect(addOrder(data)).rejects.toThrow(AppError);
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
    OrderModel.create.mockResolvedValue(mockDeliveryRequest);

    const result = await addOrder(data);

    expect(result).toEqual(mockDeliveryRequest);
  });
});

describe('assignDriverToOrderWithTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should assign driver and commit transaction', async () => {
    const order = {
      _id: 'delivery1',
      status: 'created',
      timeline: {},
      save: vi.fn(),
      driverId: null,
    };

    const driver = {
      _id: 'driver1',
      status: 'idle',
      save: vi.fn(),
    };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await assignDriverToOrderWithTransaction('delivery1', 'driver1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(order.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(order);
    expect(order.status).toBe('assigned');
    expect(order.driverId).toBe('driver1');
    expect(driver.status).toBe('assigned');
    expect(order.timeline.assignedAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if order not found', async () => {
    OrderModel.findById.mockResolvedValue(null);

    await expect(assignDriverToOrderWithTransaction('delivery1', 'driver1')).rejects.toThrow(
      notFound('DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if driver is not idle', async () => {
    const order = { _id: 'delivery1', status: 'created', timeline: {}, save: vi.fn() };
    const driver = { _id: 'driver1', status: 'assigned', save: vi.fn() };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(assignDriverToOrderWithTransaction('delivery1', 'driver1')).rejects.toThrow(
      new AppError(
        `Driver is not available. Driver status is ${driver.status}`,
        409,
        ERROR_CODES.DRIVER_NOT_IDLE
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if order status is not "created"', async () => {
    const order = { _id: 'delivery1', status: 'assigned', timeline: {}, save: vi.fn() };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(assignDriverToOrderWithTransaction('delivery1', 'driver1')).rejects.toThrow(
      new AppError(
        `Cannot assign driver. Order status is ${order.status}.`,
        409,
        ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('pickupOrderWithTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pick up order and commit transaction', async () => {
    const order = {
      _id: 'delivery1',
      status: 'assigned',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
    };

    const driver = {
      _id: 'driver1',
      status: 'idle',
      save: vi.fn(),
    };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await pickupOrderWithTransaction('delivery1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(order.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(order);
    expect(order.status).toBe('pickedUp');
    expect(driver.status).toBe('delivering');
    expect(order.timeline.pickedUpAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if order not found', async () => {
    OrderModel.findById.mockResolvedValue(null);

    await expect(pickupOrderWithTransaction('delivery1')).rejects.toThrow(
      new AppError('DeliveryRequest not found', 404, ERROR_CODES.NOT_FOUND, 'DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if order status is not "assigned"', async () => {
    const order = {
      _id: 'delivery1',
      status: 'created',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
    };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(pickupOrderWithTransaction('delivery1')).rejects.toThrow(
      new AppError(
        `Cannot pick up. Order status is ${order.status}.`,
        409,
        ERROR_CODES.PICKUP_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('deliverOrderWithTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deliver order, update driver status, set paymentStatus, and commit transaction', async () => {
    const order = {
      _id: 'delivery1',
      status: 'pickedUp',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
      paymentStatus: 'pending',
    };

    const driver = {
      _id: 'driver1',
      status: 'delivering',
      save: vi.fn(),
    };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await deliverOrderWithTransaction('delivery1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(order.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(order);
    expect(order.status).toBe('delivered');
    expect(order.paymentStatus).toBe('paid');
    expect(driver.status).toBe('idle');
    expect(order.timeline.deliveredAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if order not found', async () => {
    OrderModel.findById.mockResolvedValue(null);

    await expect(deliverOrderWithTransaction('delivery1')).rejects.toThrow(
      new AppError('DeliveryRequest not found', 404, ERROR_CODES.NOT_FOUND, 'DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if order status is not "pickedUp"', async () => {
    const order = {
      _id: 'delivery1',
      status: 'assigned',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
      paymentStatus: 'pending',
    };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(deliverOrderWithTransaction('delivery1')).rejects.toThrow(
      new AppError(
        `Cannot order. Order status is ${order.status}.`,
        409,
        ERROR_CODES.DELIVERY_NOT_DELIVERABLE
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('cancelOrderWithTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cancel order, release driver, set paymentStatus, and commit transaction', async () => {
    const order = {
      _id: 'delivery1',
      status: 'assigned',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
      paymentStatus: 'pending',
    };

    const driver = {
      _id: 'driver1',
      status: 'assigned',
      save: vi.fn(),
    };

    OrderModel.findById.mockResolvedValue(order);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await cancelOrderWithTransaction('delivery1', 'Customer requested');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();

    expect(driver.status).toBe('idle');
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(order.status).toBe('cancelled');
    expect(order.paymentStatus).toBe('failed');
    expect(order.cancelReason).toBe('Customer requested');
    expect(order.timeline.cancelledAt).toBeInstanceOf(Date);
    expect(order.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(order);
  });

  it('should cancel order even if no driver is assigned', async () => {
    const order = {
      _id: 'delivery2',
      status: 'created',
      timeline: {},
      save: vi.fn(),
      driverId: null,
      paymentStatus: 'pending',
    };

    OrderModel.findById.mockResolvedValue(order);

    await cancelOrderWithTransaction('delivery2', 'No longer needed');

    expect(order.status).toBe('cancelled');
    expect(order.paymentStatus).toBe('failed');
    expect(order.cancelReason).toBe('No longer needed');
    expect(order.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if order already delivered or cancelled', async () => {
    const order = {
      _id: 'delivery3',
      status: 'delivered',
      timeline: {},
      save: vi.fn(),
    };

    OrderModel.findById.mockResolvedValue(order);

    await expect(cancelOrderWithTransaction('delivery3', 'Late')).rejects.toThrow(
      new AppError(
        `Cannot cancel order. Order status is ${order.status}.`,
        409,
        ERROR_CODES.CANCEL_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('updateOrderInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update allowed fields and calculate finalPrice', async () => {
    const deliveryId = 'delivery123';
    const deliveryRequestData = { amountToCollect: 200 };
    const existingDelivery = {
      _id: deliveryId,
      status: 'created',
      amountToCollect: 100,
      deliveryPrice: { total: 50 },
    };

    OrderModel.findById.mockResolvedValue(existingDelivery);
    orderUpdateQuery.mockReturnValue({ amountToCollect: 200 });

    const updatedDelivery = { ...existingDelivery, amountToCollect: 200, finalPrice: 250 };
    OrderModel.findByIdAndUpdate.mockResolvedValue(updatedDelivery);

    const result = await updateOrderInfo(deliveryId, deliveryRequestData);

    expect(orderUpdateQuery).toHaveBeenCalledWith(deliveryRequestData, expect.any(Object));
    expect(OrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      deliveryId,
      { $set: { amountToCollect: 200, finalPrice: 250 } },
      { new: true, runValidators: true }
    );
    expect(result).toEqual(updatedDelivery);
  });

  it('should throw error if order not found', async () => {
    OrderModel.findById.mockResolvedValue(null);

    await expect(updateOrderInfo('notfound', {})).rejects.toThrow(notFound('DeliveryRequest'));
  });

  it('should throw error if no fields provided for update', async () => {
    const deliveryId = 'delivery123';
    const existingDelivery = {
      _id: deliveryId,
      status: 'created',
      amountToCollect: 100,
      deliveryPrice: { total: 50 },
    };

    OrderModel.findById.mockResolvedValue(existingDelivery);
    orderUpdateQuery.mockReturnValue({}); // no fields to update

    await expect(updateOrderInfo(deliveryId, {})).rejects.toThrow();
  });

  it('should throw error if order status is not updatable', async () => {
    const deliveryId = 'delivery123';
    const existingDelivery = {
      _id: deliveryId,
      status: 'delivered',
      amountToCollect: 100,
      deliveryPrice: { total: 50 },
    };

    OrderModel.findById.mockResolvedValue(existingDelivery);

    await expect(updateOrderInfo(deliveryId, { amountToCollect: 200 })).rejects.toMatchObject({
      code: ERROR_CODES.UPDATE_NOT_AVAILABLE,
    });
  });
});

describe('getOrderById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return order if found', async () => {
    const deliveryId = 'delivery123';
    const mockDelivery = { _id: deliveryId, status: 'created' };

    OrderModel.findById.mockResolvedValue(mockDelivery);

    const result = await getOrderById(deliveryId);

    expect(OrderModel.findById).toHaveBeenCalledWith(deliveryId);
    expect(result).toEqual(mockDelivery);
  });

  it('should throw notFound error if order does not exist', async () => {
    const deliveryId = 'notfound';

    OrderModel.findById.mockResolvedValue(null);

    await expect(getOrderById(deliveryId)).rejects.toThrow(notFound('DeliveryRequest'));
    expect(OrderModel.findById).toHaveBeenCalledWith(deliveryId);
  });
});

describe('getAllOrders', () => {
  it('should return orders list', async () => {
    const mockOrders = [{ _id: '3' }, { _id: '2' }, { _id: '1' }];
    driverQueryBuilder.mockReturnValue(mockOrders);
    OrderModel.countDocuments.mockResolvedValue(10);
    OrderModel.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockOrders),
    });

    const result = await getAllOrders(2, 4);

    expect(result).toEqual({
      orders: mockOrders,
      totalOrders: 10,
      totalPage: 3,
    });
  });

  it('should return order lists by status: assigned ', async () => {
    const mockOrders = [
      { _id: '4', status: 'assigned' },
      { _id: '2', status: 'assigned' },
      { _id: '3', status: 'assigned' },
      { _id: '1', status: 'assigned' },
    ];
    driverQueryBuilder.mockReturnValue(mockOrders);

    OrderModel.countDocuments.mockResolvedValue(14);
    OrderModel.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockOrders),
    });

    const result = await getAllOrders(1, 5, { status: 'assigned' });

    expect(result).toEqual({
      orders: mockOrders,
      totalOrders: 14,
      totalPage: 3,
    });
  });
});
