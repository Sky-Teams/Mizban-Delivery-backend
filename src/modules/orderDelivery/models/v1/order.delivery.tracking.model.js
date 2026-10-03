import mongoose, { model, mongo } from 'mongoose';

const orderDeliverySchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    toPickUp: {
      startedAt: {
        type: Date,
        default: null,
      },
      endedAt: {
        type: Date,
        default: null,
      },
      distanceMeters: {
        type: Number,
        default: 0,
        min: 0,
      },
      durationSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    toDelivery: {
      startedAt: {
        type: Date,
        default: null,
      },
      endedAt: {
        type: Date,
        default: null,
      },
      distanceMeters: {
        type: Number,
        default: 0,
        min: 0,
      },
      durationSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

orderDeliverySchema.index({ order: 1 }, { unique: true });

export const OrderDeliveryModel = mongoose.model('OrderDelivery', orderDeliverySchema);
