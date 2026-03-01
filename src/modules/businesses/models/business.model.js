import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['restaurant', 'shop', 'pharmacy', 'warehouse', 'other'],
      required: true,
      default: 'other',
    },
    phone: {
      type: String,
      trim: true,
    },
    addressText: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0],
      },
    },
    prepTimeAvgMinutes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: '2dsphere', ownerId: 1 });

export const BusinessModel = mongoose.model('Business', BusinessSchema);
