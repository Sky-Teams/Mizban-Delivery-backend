import mongoose from 'mongoose';

export const businessCustomerSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String },
    email: { type: String, required: true },
    addressText: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    notes: { type: String },
    tags: { type: [String] },
    isActive: { type: Boolean, default: true },
    lastOrderAt: { type: Date, default: null },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

businessCustomerSchema.index({ business: 1 });
businessCustomerSchema.index({ business: 1, phone: 1 }, { unique: true });
businessCustomerSchema.index({ business: 1, email: 1 }, { unique: true });
businessCustomerSchema.index({ location: '2dsphere' });

export const businessCustomerModel = mongoose.model('BusinessCustomer', businessCustomerSchema);
