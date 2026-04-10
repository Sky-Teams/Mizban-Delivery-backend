import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '#modules/users/index.js';
import { hashPassword } from '#shared/utils/jwt.js';
import { DriverModel } from '#modules/drivers/index.js';

dotenv.config();

await mongoose.connect(process.env.DB_URI);
await mongoose.connection.dropDatabase();

const createAdmin = async () => {
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
    isVerified: true,
  });
  console.log('Admin user created successfully');
};

const fakeDrivers = [
  {
    name: 'Ahmad Rahimi',
    email: 'ahmad.rahimi1@gamil.com',
    phone: '+93700123456',
    password: await hashPassword('driver12345'),
    vehicleType: 'bike',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-4502312',
    address: 'Herat City, District 2',
    ratingAvg: 2.5,
    ratingCount: 12,
    acceptanceRate: 0.65,
    capacity: {
      maxWeightKg: 15,
      maxPackages: 5,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.1915, 34.352],
    },
    timeAvailability: {
      start: '09:00',
      end: '17:00',
    },
  },
  {
    name: 'Mahmood Naseri',
    email: 'mahmood.naseri@gamil.com',
    phone: '+93700123457',
    password: await hashPassword('driver12345'),
    vehicleType: 'bike',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-452312',
    address: 'Herat City, District 2',
    ratingAvg: 4.2,
    ratingCount: 45,
    acceptanceRate: 0.88,
    capacity: {
      maxWeightKg: 15,
      maxPackages: 5,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.185, 34.3485],
    },
    timeAvailability: {
      start: '09:00',
      end: '17:00',
    },
  },
  {
    name: 'Farid Ahmadi',
    email: 'farid.ahmadi@gamil.com',
    phone: '+93700123458',
    password: await hashPassword('driver12345'),
    vehicleType: 'bike',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-453001',
    address: 'Herat City, District 3',
    ratingAvg: 3.8,
    ratingCount: 30,
    acceptanceRate: 0.75,
    capacity: {
      maxWeightKg: 12,
      maxPackages: 4,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.1982, 34.345],
    },
    timeAvailability: {
      start: '08:00',
      end: '16:00',
    },
  },
  {
    name: 'Samiullah Qadiri',
    email: 'samiullah.qadiri@gamil.com',
    phone: '+93700123459',
    password: await hashPassword('driver12345'),
    vehicleType: 'car',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-453002',
    address: 'Herat City, District 4',
    ratingAvg: 4.7,
    ratingCount: 80,
    acceptanceRate: 0.92,
    capacity: {
      maxWeightKg: 50,
      maxPackages: 10,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.1803, 34.3555],
    },
    timeAvailability: {
      start: '10:00',
      end: '18:00',
    },
  },
  {
    name: 'Jawad Karimi',
    email: 'jawad.karimi@gamil.com',
    phone: '+93700123460',
    password: await hashPassword('driver12345'),
    vehicleType: 'bike',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-453003',
    address: 'Herat City, District 1',
    ratingAvg: 3.2,
    ratingCount: 20,
    acceptanceRate: 0.7,
    capacity: {
      maxWeightKg: 10,
      maxPackages: 3,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.195, 34.3602],
    },
    timeAvailability: {
      start: '09:00',
      end: '15:00',
    },
  },
  {
    name: 'Bilal Noori',
    email: 'bilal.noori@gamil.com',
    phone: '+93700123461',
    password: await hashPassword('driver12345'),
    vehicleType: 'bike',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-453004',
    address: 'Herat City, District 5',
    ratingAvg: 4.0,
    ratingCount: 55,
    acceptanceRate: 0.85,
    capacity: {
      maxWeightKg: 18,
      maxPackages: 6,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.188, 34.3498],
    },
    timeAvailability: {
      start: '07:00',
      end: '14:00',
    },
  },
  {
    name: 'Najeebullah Azizi',
    email: 'najeeb.azizi@gamil.com',
    phone: '+93700123462',
    password: await hashPassword('driver12345'),
    vehicleType: 'car',
    status: 'idle',
    vehicleRegistrationNumber: 'HR-453005',
    address: 'Herat City, District 6',
    ratingAvg: 4.9,
    ratingCount: 120,
    acceptanceRate: 0.95,
    capacity: {
      maxWeightKg: 60,
      maxPackages: 12,
    },
    currentLocation: {
      type: 'Point',
      coordinates: [62.192, 34.347],
    },
    timeAvailability: {
      start: '11:00',
      end: '20:00',
    },
  },
];

const createFakeDrivers = async () => {
  const users = fakeDrivers.map((driver) => {
    return {
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      password: driver.password,
      role: 'driver',
      isVerified: true,
    };
  });
  const newUsers = await UserModel.insertMany(users);

  const newDrivers = [];
  fakeDrivers.map((driver, index) => {
    return newDrivers.push({
      user: newUsers[index]._id,
      vehicleType: driver.vehicleType,
      status: driver.status,
      vehicleRegistrationNumber: driver.vehicleRegistrationNumber,
      address: driver.address,
      capacity: driver.capacity,
      ratingCount: driver.ratingCount,
      ratingAvg: driver.ratingAvg,
      acceptanceRate: driver.acceptanceRate,
      currentLocation: driver.currentLocation,
      timeAvailability: driver.timeAvailability,
    });
  });

  await DriverModel.insertMany(newDrivers);

  console.log('Drivers created successfully');
};

const seed = async () => {
  try {
    await createAdmin();
    await createFakeDrivers();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database', error);
    process.exit(1);
  }
};

seed();
