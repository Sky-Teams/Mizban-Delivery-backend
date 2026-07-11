import mongoose from 'mongoose';

// This metadata is used to show the offer details to the driver
const OfferMetadataSchema = new mongoose.Schema(
  {
    orderType: { type: String },
    serviceType: { type: String },
    pickupLocation: { type: mongoose.Schema.Types.Mixed },
    dropoffLocation: { type: mongoose.Schema.Types.Mixed },
    distance: { type: Number },
    eta: { type: Number },
    packageDetails: { type: mongoose.Schema.Types.Mixed },
    paymentType: { type: String },
    amountToCollect: { type: Number },
    finalPrice: { type: Number },
    expiresIn: { type: Number },
    receiverArea: { type: String },
  },
  { _id: false }
);

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
    metadata: OfferMetadataSchema,
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ order: 1, driver: 1 });
offerSchema.index({ driver: 1, status: 1 }); // Set index for driver and status to help us in calculating the acceptance rate

export const OfferModel = mongoose.model('Offer', offerSchema);
