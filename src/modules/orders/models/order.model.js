import { ORDER_STATUS } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';
import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

//TODO Most of the fields are optional, because for now we just want to be able to create a delivery request easily without any complex logic.We will extend it in future
const OrderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['food', 'parcel', 'grocery', 'other'],
      default: 'other',
      required: true,
    },

    serviceType: {
      type: String,
      enum: ['immediate', 'scheduled'], // Scheduled is for those deliveries that can be delivered in more than one day.
      default: 'immediate',
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    deliveryDeadline: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ['normal', 'high', 'critical'],
      default: 'normal',
    },

    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    receiver: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },

    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    dropoffLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    packageDetails: {
      weight: { type: Number, default: 0 },
      size: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
      fragile: { type: Boolean, default: false },
      note: { type: String, default: null },
    },

    serviceLevel: { type: String, enum: ['standard', 'express'], default: 'standard' },

    estimatedPrepTimeMinutes: { type: Number, default: 0 },

    paymentType: { type: String, enum: ['online', 'COD'], required: true },

    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

    amountToCollect: { type: Number, default: 0, min: 0 }, // The amount of money that driver should collect for the business

    deliveryPrice: {
      baseFee: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      distanceKm: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      distanceFee: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      timeFee: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      priorityFee: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      discount: { type: Number, default: 0, min: 0 }, // For now we set it to zero, its for the future calculation
      total: { type: Number, default: 0, required: true, min: 0 },
    },
    //   finalPrice = amountToCollect + deliveryPrice.total
    finalPrice: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: getObjectValues(ORDER_STATUS),
      default: ORDER_STATUS.CREATED,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    //List of recommended drivers for this order
    recommendedDrivers: [
      {
        _id: false, // we dont need the auto generated Id for this object
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
        eta: { type: Number, default: 0 },
        distance: { type: Number, default: 0 },
      },
    ],
    currentDriverIndex: { type: Number, default: 0 }, // pointer to the next driver to send offer

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    timeline: {
      assignedAt: { type: Date, default: null },
      pickedUpAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      returnedAt: { type: Date, default: null },
    },
    items: {
      type: [ItemSchema],
      default: [],
    },
    cancelReason: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ pickupLocation: '2dsphere' });
OrderSchema.index({ dropoffLocation: '2dsphere' });
OrderSchema.index({ driverId: 1 });
OrderSchema.index({ status: 1 });

export const OrderModel = mongoose.model('Order', OrderSchema);
