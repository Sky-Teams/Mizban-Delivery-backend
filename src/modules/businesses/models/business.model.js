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
      },
      coordinates: {
        type: [Number],
      },
    },
    prepTimeAvgMinutes: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ location: '2dsphere' });

export const BusinessModel = mongoose.model('Business', BusinessSchema);
