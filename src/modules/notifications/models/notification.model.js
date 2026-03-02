import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['system', 'payment', 'delivery_update'],
      required: true,
      default: 'system',
    },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    message: { type: String, trim: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1 });

export const NotificationModel = mongoose.model('Notification', NotificationSchema);
