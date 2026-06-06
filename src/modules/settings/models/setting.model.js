import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema(
  {
    //Name of the option that admin can update => ex:commission.rate
    key: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SettingModel = mongoose.model('Setting', SettingSchema);
