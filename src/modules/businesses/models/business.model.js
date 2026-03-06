import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema(
  {
    owner: {
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
      required: true,
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
        default: 'Point',
      },
      coordinates: {
        type: [Number],
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

BusinessSchema.index({ owner: 1, phone: 1 }, { unique: true });
BusinessSchema.index({ location: '2dsphere' });

export const BusinessModel = mongoose.model('Business', BusinessSchema);
