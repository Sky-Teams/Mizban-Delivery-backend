import mongoose from 'mongoose';
import { REASON_TYPES } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';

/** A reusable schema for reason of an action.
 * if driver registration request is rejected, we need a reason for it,
 * if order is cancelled, we need a reason for it.
 */
export const reasonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: getObjectValues(REASON_TYPES),
    },
    description: { type: String },
    date: { type: Date },
  },
  { _id: false }
);
