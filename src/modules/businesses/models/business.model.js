import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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
      required: true,
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
        enum: ['point'],
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

BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ location: '2dsphere' });

export const BusinessModel = mongoose.model('Business', BusinessSchema);
