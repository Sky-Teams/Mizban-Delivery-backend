import mongoose from 'mongoose';
import 'dotenv/config';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { UserModel } from '#modules/users/index.js';
import { DriverModel } from '#modules/drivers/index.js';
import { randomUUID } from 'crypto';
import { OrderModel } from '#modules/orders/index.js';
import { ORDER_STATUS } from '#shared/utils/enums.js';
let replSet;

export const connectDB = async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger', // required for transactions
    },
  });

  const uri = replSet.getUri();
  await mongoose.connect(uri);
};

export const disconnectDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (replSet) {
    await replSet.stop();
  }
};
export const clearDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

export const createFakeUserWithToken = async (role = 'customer') => {
  const user = await UserModel.create({
    name: 'Test User',
    email: `test${randomUUID()}@example.com`,
    password: 'hashedpassword123',
    role,
  });

  const secret = process.env.JWT_SECRET || 'mizban-delivery-system-key';
  const testUserId = user._id;
  const token = jwt.sign({ id: testUserId }, secret, {
    expiresIn: '1h',
  });

  return { testUserId, token, user };
};

// If we pass a user({_id,name,email}) to this function, it doesn't create a record in user collection and only create a driver record.
export const createFakeDriver = async (user) => {
  if (!user) {
    user = await UserModel.create({
      name: 'Driver',
      email: `driver${randomUUID()}@example.com`,
      password: 'hashedpassword123',
      role: 'driver',
    });
  }

  const newDriver = await DriverModel.create({
    user: user._id,
    vehicleType: 'motorbike',
    status: 'idle',
    currentLocation: { coordinates: [55, 55] },
    vehicleRegistrationNumber: `ADM-${randomUUID()}`,
    capacity: {
      maxWeightKg: 100,
      maxPackages: 5,
    },
    timeAvailability: {
      start: '08:00',
      end: '18:00',
    },
  });

  return newDriver;
};

export const createFakeOrder = async (overrides = {}) => {
  return await OrderModel.create({
    type: 'parcel',
    serviceType: 'immediate',
    status: ORDER_STATUS.CREATED,

    sender: { name: 'Test Sender', phone: '0700000000' },
    receiver: {
      name: 'Test Receiver',
      phone: '0700000000',
      address: 'Herat',
    },

    pickupLocation: { type: 'Point', coordinates: [62.2, 34.35] },
    dropoffLocation: { type: 'Point', coordinates: [62.2, 34.35] },

    paymentType: 'COD',
    amountToCollect: 100,
    deliveryPrice: { total: 20 },

    createdAt: new Date(),

    ...overrides,
  });
};
