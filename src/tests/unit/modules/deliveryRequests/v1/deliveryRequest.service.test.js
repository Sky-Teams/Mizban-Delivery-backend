import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  doesDriverExistByDriverId,
  DriverModel,
  getDriverStatusByDriverId,
} from '#modules/drivers/index.js';
import { AppError, notFound } from '#shared/errors/error.js';
import { calculateItemsTotal } from '#shared/utils/math.helper.js';
import {
  assignDriverToDeliveryRequest,
  cancelDeliveryRequest,
  createDeliveryRequest,
  deliverDeliveryRequest,
  DeliveryRequestModel,
  pickupDeliveryRequest,
} from '#modules/deliveryRequests/index.js';
import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { deliveryRequestUpdateQuery } from '#shared/utils/queryBuilder.js';
import {
  getDeliveryRequestById,
  updateDeliveryRequestInfo,
} from '#modules/deliveryRequests/services/v1/deliveryRequest.service.js';

vi.mock('#modules/deliveryRequests/models/deliveryRequest.model.js', () => ({
  DeliveryRequestModel: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
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
  deliveryRequestUpdateQuery: vi.fn(),
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
      location: { type: 'Point', coordinates: [0, 0] },
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

describe('assignDriverToDeliveryRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should assign driver and commit transaction', async () => {
    const delivery = {
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

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await assignDriverToDeliveryRequest('delivery1', 'driver1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(delivery.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(delivery);
    expect(delivery.status).toBe('assigned');
    expect(delivery.driverId).toBe('driver1');
    expect(driver.status).toBe('assigned');
    expect(delivery.timeline.assignedAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if delivery not found', async () => {
    DeliveryRequestModel.findById.mockResolvedValue(null);

    await expect(assignDriverToDeliveryRequest('delivery1', 'driver1')).rejects.toThrow(
      notFound('DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if driver is not idle', async () => {
    const delivery = { _id: 'delivery1', status: 'created', timeline: {}, save: vi.fn() };
    const driver = { _id: 'driver1', status: 'assigned', save: vi.fn() };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(assignDriverToDeliveryRequest('delivery1', 'driver1')).rejects.toThrow(
      new AppError(
        `Driver is not available. Driver status is ${driver.status}`,
        409,
        ERROR_CODES.DRIVER_NOT_IDLE
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if delivery status is not "created"', async () => {
    const delivery = { _id: 'delivery1', status: 'assigned', timeline: {}, save: vi.fn() };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(assignDriverToDeliveryRequest('delivery1', 'driver1')).rejects.toThrow(
      new AppError(
        `Cannot assign driver. Delivery status is ${delivery.status}.`,
        409,
        ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('pickupDeliveryRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pick up delivery and commit transaction', async () => {
    const delivery = {
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

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await pickupDeliveryRequest('delivery1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(delivery.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(delivery);
    expect(delivery.status).toBe('pickedUp');
    expect(driver.status).toBe('delivering');
    expect(delivery.timeline.pickedUpAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if delivery not found', async () => {
    DeliveryRequestModel.findById.mockResolvedValue(null);

    await expect(pickupDeliveryRequest('delivery1')).rejects.toThrow(
      new AppError('DeliveryRequest not found', 404, ERROR_CODES.NOT_FOUND, 'DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if delivery status is not "assigned"', async () => {
    const delivery = {
      _id: 'delivery1',
      status: 'created',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
    };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(pickupDeliveryRequest('delivery1')).rejects.toThrow(
      new AppError(
        `Cannot pick up. Delivery status is ${delivery.status}.`,
        409,
        ERROR_CODES.PICKUP_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('deliverDeliveryRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deliver delivery, update driver status, set paymentStatus, and commit transaction', async () => {
    const delivery = {
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

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await deliverDeliveryRequest('delivery1');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();
    expect(delivery.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(delivery);
    expect(delivery.status).toBe('delivered');
    expect(delivery.paymentStatus).toBe('paid');
    expect(driver.status).toBe('idle');
    expect(delivery.timeline.deliveredAt).toBeInstanceOf(Date);
  });

  it('should abort transaction if delivery not found', async () => {
    DeliveryRequestModel.findById.mockResolvedValue(null);

    await expect(deliverDeliveryRequest('delivery1')).rejects.toThrow(
      new AppError('DeliveryRequest not found', 404, ERROR_CODES.NOT_FOUND, 'DeliveryRequest')
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if delivery status is not "pickedUp"', async () => {
    const delivery = {
      _id: 'delivery1',
      status: 'assigned',
      timeline: {},
      save: vi.fn(),
      driverId: 'driver1',
      paymentStatus: 'pending',
    };
    const driver = { _id: 'driver1', status: 'idle', save: vi.fn() };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    await expect(deliverDeliveryRequest('delivery1')).rejects.toThrow(
      new AppError(
        `Cannot deliver. Delivery status is ${delivery.status}.`,
        409,
        ERROR_CODES.DELIVERY_NOT_DELIVERABLE
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('cancelDeliveryRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cancel delivery, release driver, set paymentStatus, and commit transaction', async () => {
    const delivery = {
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

    DeliveryRequestModel.findById.mockResolvedValue(delivery);
    getDriverStatusByDriverId.mockResolvedValue(driver);

    const result = await cancelDeliveryRequest('delivery1', 'Customer requested');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(fakeSession.startTransaction).toHaveBeenCalled();

    expect(driver.status).toBe('idle');
    expect(driver.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(delivery.status).toBe('cancelled');
    expect(delivery.paymentStatus).toBe('failed');
    expect(delivery.cancelReason).toBe('Customer requested');
    expect(delivery.timeline.cancelledAt).toBeInstanceOf(Date);
    expect(delivery.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();

    expect(result).toBe(delivery);
  });

  it('should cancel delivery even if no driver is assigned', async () => {
    const delivery = {
      _id: 'delivery2',
      status: 'created',
      timeline: {},
      save: vi.fn(),
      driverId: null,
      paymentStatus: 'pending',
    };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);

    await cancelDeliveryRequest('delivery2', 'No longer needed');

    expect(delivery.status).toBe('cancelled');
    expect(delivery.paymentStatus).toBe('failed');
    expect(delivery.cancelReason).toBe('No longer needed');
    expect(delivery.save).toHaveBeenCalledWith({ session: fakeSession });

    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it('should throw error if delivery already delivered or cancelled', async () => {
    const delivery = {
      _id: 'delivery3',
      status: 'delivered',
      timeline: {},
      save: vi.fn(),
    };

    DeliveryRequestModel.findById.mockResolvedValue(delivery);

    await expect(cancelDeliveryRequest('delivery3', 'Late')).rejects.toThrow(
      new AppError(
        `Cannot cancel delivery. Delivery status is ${delivery.status}.`,
        409,
        ERROR_CODES.CANCEL_NOT_ALLOWED
      )
    );

    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });
});

describe('updateDeliveryRequestInfo', () => {
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

    DeliveryRequestModel.findById.mockResolvedValue(existingDelivery);
    deliveryRequestUpdateQuery.mockReturnValue({ amountToCollect: 200 });

    const updatedDelivery = { ...existingDelivery, amountToCollect: 200, finalPrice: 250 };
    DeliveryRequestModel.findByIdAndUpdate.mockResolvedValue(updatedDelivery);

    const result = await updateDeliveryRequestInfo(deliveryId, deliveryRequestData);

    expect(deliveryRequestUpdateQuery).toHaveBeenCalledWith(
      deliveryRequestData,
      expect.any(Object)
    );
    expect(DeliveryRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(
      deliveryId,
      { $set: { amountToCollect: 200, finalPrice: 250 } },
      { new: true, runValidators: true }
    );
    expect(result).toEqual(updatedDelivery);
  });

  it('should throw error if delivery not found', async () => {
    DeliveryRequestModel.findById.mockResolvedValue(null);

    await expect(updateDeliveryRequestInfo('notfound', {})).rejects.toThrow(
      notFound('DeliveryRequest')
    );
  });

  it('should throw error if no fields provided for update', async () => {
    const deliveryId = 'delivery123';
    const existingDelivery = {
      _id: deliveryId,
      status: 'created',
      amountToCollect: 100,
      deliveryPrice: { total: 50 },
    };

    DeliveryRequestModel.findById.mockResolvedValue(existingDelivery);
    deliveryRequestUpdateQuery.mockReturnValue({}); // no fields to update

    await expect(updateDeliveryRequestInfo(deliveryId, {})).rejects.toThrow();
  });

  it('should throw error if delivery status is not updatable', async () => {
    const deliveryId = 'delivery123';
    const existingDelivery = {
      _id: deliveryId,
      status: 'delivered',
      amountToCollect: 100,
      deliveryPrice: { total: 50 },
    };

    DeliveryRequestModel.findById.mockResolvedValue(existingDelivery);

    await expect(
      updateDeliveryRequestInfo(deliveryId, { amountToCollect: 200 })
    ).rejects.toMatchObject({
      code: ERROR_CODES.UPDATE_NOT_AVAILABLE,
    });
  });
});

describe('getDeliveryRequestById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return delivery request if found', async () => {
    const deliveryId = 'delivery123';
    const mockDelivery = { _id: deliveryId, status: 'created' };

    DeliveryRequestModel.findById.mockResolvedValue(mockDelivery);

    const result = await getDeliveryRequestById(deliveryId);

    expect(DeliveryRequestModel.findById).toHaveBeenCalledWith(deliveryId);
    expect(result).toEqual(mockDelivery);
  });

  it('should throw notFound error if delivery request does not exist', async () => {
    const deliveryId = 'notfound';

    DeliveryRequestModel.findById.mockResolvedValue(null);

    await expect(getDeliveryRequestById(deliveryId)).rejects.toThrow(notFound('DeliveryRequest'));
    expect(DeliveryRequestModel.findById).toHaveBeenCalledWith(deliveryId);
  });
});
