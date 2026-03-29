import mongoose from 'mongoose';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    googleId: { type: String, default: null },
    role: { type: String, enum: ['customer', 'driver', 'business', 'admin'], default: 'driver' },
    changedPasswordAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
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

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

export const UserModel = mongoose.model('User', UserSchema);
