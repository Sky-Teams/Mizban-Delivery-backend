import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['customer', 'driver', 'business', 'admin'],
      default: 'driver',
    },

    changedPasswordAt: {
      type: Date,
      default: null,
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

UserSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $ne: null },
    },
  }
);

export const UserModel = mongoose.model('User', UserSchema);
