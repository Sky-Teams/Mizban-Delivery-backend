import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);

    const name = 'Admin';
    const email = 'admin@gmail.com';
    const password = 'admin123';

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(password);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
