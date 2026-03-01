import mongoose from 'mongoose';

export const businessCustomerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String },
    addressText: { type: String, required: true },
    location: {
      type: [Number, Number],
      enum: ['point'],
    },
    notes: { type: String },
    tags: { type: [String], required: true },
    isActive: { type: Boolean, default: true },
    lastOrderedAt: { type: Date, default: null },
    totalOrders: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

businessCustomerSchema.index({ businessId: 1 });
businessCustomerSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export const businessCustomerModel = mongoose.model('BusinessCustomer', businessCustomerSchema);
