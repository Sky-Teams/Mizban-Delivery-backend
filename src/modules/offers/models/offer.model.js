import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orders',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    offeredAt: {
      type: Date,
      default: new Date(),
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ order: 1, driver: 1 });
offerSchema.index({ driver: 1, status: 1 }); // Set index for driver and status to help us in calculating the acceptance rate

export const OfferModel = mongoose.model('Offer', offerSchema);
