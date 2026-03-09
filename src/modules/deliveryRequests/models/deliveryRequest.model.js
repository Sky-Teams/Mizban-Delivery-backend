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
const DeliveryRequestSchema = new mongoose.Schema(
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
      enum: ['created', 'assigned', 'pickedUp', 'delivered', 'cancelled', 'failed'],
      default: 'created',
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    timeline: {
      assignedAt: { type: Date, default: null },
      pickedUpAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },
    items: {
      type: [ItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

DeliveryRequestSchema.index({ pickupLocation: '2dsphere' });
DeliveryRequestSchema.index({ dropoffLocation: '2dsphere' });
DeliveryRequestSchema.index({ 'receiver.location': '2dsphere' });
DeliveryRequestSchema.index({ driverId: 1 });
DeliveryRequestSchema.index({ status: 1 });

export const DeliveryRequestModel = mongoose.model('DeliveryRequest', DeliveryRequestSchema);
