import { BATCH_STATUS, STOP_STATUS, STOP_TYPE } from '#shared/utils/enums.js';
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
    stops: [
      {
        _id: false,
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
          required: true,
        },
        stopType: {
          type: String,
          enum: getObjectValues(STOP_TYPE),
          required: true,
        },
        location: {
          type: [Number],
          required: true,
        },
        stopStatus: {
          type: String,
          enum: getObjectValues(STOP_STATUS),
          default: STOP_STATUS.PENDING,
        },
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
  },
  { timestamps: true }
);

deliveryBatchSchema.index({ driver: 1, status: 1 });
deliveryBatchSchema.index(
  { driver: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: BATCH_STATUS.ACTIVE,
    },
  }
);

export const DeliveryBatchModel = mongoose.model('DeliveryBatch', deliveryBatchSchema);
