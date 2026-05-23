import { reasonSchema } from '#shared/schemas/reason.schema.js';
import {
  DRIVER_STATUS,
  FUEL_TYPE,
  VEHICLE_TYPE,
  VERIFICATION_STATUS,
} from '#shared/utils/enums.js';
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
    vehicleName: {
      type: String,
      trim: true,
      default: null,
    },
    vehicleType: {
      type: String,
      enum: getObjectValues(VEHICLE_TYPE),
      required: true,
      default: VEHICLE_TYPE.MOTORBIKE,
    },
    fuelType: {
      type: String,
      enum: getObjectValues(FUEL_TYPE),
      default: null,
    },
    vehicleColor: {
      type: String,
      trim: true,
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: null,
    },

    emergencyContactNumber: {
      type: String,
      trim: true,
      default: null,
    },

    emergencyContactRelation: {
      type: String,
      trim: true,
      default: null,
    },

    documents: {
      photo: {
        type: String,
        default: null,
      },

      nationalIdCard: {
        front: { type: String, default: null },
        back: { type: String, default: null },
      },

      driverLicense: {
        type: String,
        default: null,
      },

      vehicleCard: {
        type: String,
        default: null,
      },
    },

    // Verification status can help us in registration process(pending => accepted/rejected).
    verificationStatus: {
      type: String,
      enum: getObjectValues(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
    status: {
      type: String,
      enum: getObjectValues(DRIVER_STATUS),
      default: DRIVER_STATUS.OFFLINE,
    },
    capacity: {
      maxWeightKg: { type: Number, min: 0, default: 0 },
      maxPackages: { type: Number, min: 0, default: 0 },
    },
    activeOrders: { type: Number, default: 0, min: 0 }, // Number of active orders of a driver
    maxOrders: { type: Number, default: 5, min: 1 }, // This default values is only for test, we can change it later.
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    vehicleRegistrationNumber: { type: String, required: true, unique: true },
    address: { type: String, default: null },
    timeAvailability: {
      start: {
        type: String,
        default: null,
      },
      end: {
        type: String,
        default: null,
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
    dateOfBirth: {
      type: Date,
      default: null,
    },
    reason: {
      type: reasonSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

DriverSchema.index({ currentLocation: '2dsphere' });
DriverSchema.methods.releaseFromOrder = async function (session) {
  this.status = DRIVER_STATUS.IDLE;
  this.activeOrders = Math.max(0, this.activeOrders - 1);

  return this.save({ session });
};
export const DriverModel = mongoose.model('Driver', DriverSchema);
