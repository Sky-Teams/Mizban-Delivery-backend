import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'van'],
      required: true,
      default: 'bike',
    },
    status: {
      type: String,
      enum: ['offline', 'idle', 'assigned', 'delivering'],
      default: 'offline',
    },
    capacity: {
      maxWeightKg: { type: Number, required: true },
      maxPackages: { type: Number, required: true },
    },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
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
