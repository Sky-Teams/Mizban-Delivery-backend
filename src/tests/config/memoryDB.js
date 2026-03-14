import mongoose from 'mongoose';
import 'dotenv/config';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { UserModel } from '#modules/users/index.js';

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
    email: 'test@example.com',
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
