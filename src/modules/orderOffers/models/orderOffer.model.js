import mongoose from 'mongoose';

const OrderOfferSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

OrderOfferSchema.index({ order: 1, driver: 1 });
OrderOfferSchema.index({ status: 1 });

export const OrderOfferModel = mongoose.model('OrderOffer', OrderOfferSchema);
