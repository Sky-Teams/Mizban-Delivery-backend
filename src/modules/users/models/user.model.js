import mongoose from 'mongoose';
import crypto from 'crypto';
import { hashToken } from '#shared/utils/jwt.js';

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
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    fcmToken: { type: String, default: null },
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

UserSchema.methods.createToken = function (type) {
  const token = crypto.randomBytes(32).toString('hex');

  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  if (type === 'reset') {
    this.passwordResetToken = hashedToken;
    this.passwordResetExpires = expires;
  }

  if (type === 'verify') {
    this.emailVerificationToken = hashedToken;
    this.emailVerificationExpires = expires;
  }

  return token;
};

export const UserModel = mongoose.model('User', UserSchema);
