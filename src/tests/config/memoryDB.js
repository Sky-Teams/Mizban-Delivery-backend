import mongoose from 'mongoose';
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { UserModel } from '#modules/users/index.js';

let mongoServer;

export const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

export const createFakeUserWithToken = async (overrides = {}) => {
  const unique = Date.now() + Math.floor(Math.random() * 10000);
  const user = await UserModel.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `test-${unique}@example.com`,
    password: overrides.password || 'hashedpassword123',
    role: overrides.role || 'customer',
  });

  const secret = process.env.JWT_SECRET || 'mizban-delivery-system-key';

  const testUserId = user._id;

  const token = jwt.sign({ id: testUserId }, secret, {
    expiresIn: '1h',
  });

  return { testUserId, token, user };
};
