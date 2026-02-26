import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  deviceId: {
    type: string,
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
  },
});

export const RefreshTokenModel = mongoose.model('RefreshToken', RefreshTokenSchema);
