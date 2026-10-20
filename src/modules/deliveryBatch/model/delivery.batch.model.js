import { BATCH_STATUS } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';
import mongoose from 'mongoose';

const deliveryBatchSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    orderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    routeOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        // TODO: we will add more field here in future
      },
    ],
    status: {
      type: String,
      enum: getObjectValues(BATCH_STATUS),
      default: BATCH_STATUS.ACTIVE,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    distanceMeters: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

deliveryBatchSchema.index({ driver: 1, status: 1 });
deliveryBatchSchema.index(
  { driver: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [BATCH_STATUS.ACTIVE],
      },
    },
  }
);

export const DeliveryBatchModel = mongoose.model('DeliveryBatch', deliveryBatchSchema);
