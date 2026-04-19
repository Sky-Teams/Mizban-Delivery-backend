import { DRIVER_STATUS, VEHICLE_TYPE } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';
import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: getObjectValues(VEHICLE_TYPE),
      required: true,
      default: VEHICLE_TYPE.MOTORBIKE,
    },
    status: {
      type: String,
      enum: getObjectValues(DRIVER_STATUS),
      default: DRIVER_STATUS.OFFLINE,
    },
    capacity: {
      maxWeightKg: { type: Number, min: 0, required: true },
      maxPackages: { type: Number, min: 0, required: true },
    },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    vehicleRegistrationNumber: { type: String, required: true, unique: true },
    address: { type: String, default: null },
    timeAvailability: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    lastLocationAt: {
      type: Date,
      default: null,
    },

    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },

    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

DriverSchema.index({ currentLocation: '2dsphere' });

export const DriverModel = mongoose.model('Driver', DriverSchema);
