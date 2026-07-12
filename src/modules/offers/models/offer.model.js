import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
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
    metadata: {
      // For now we define it a simple object, in the future may define a schema for it
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ order: 1, driver: 1 });
offerSchema.index({ driver: 1, status: 1 }); // Set index for driver and status to help us in calculating the acceptance rate

export const OfferModel = mongoose.model('Offer', offerSchema);
