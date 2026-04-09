import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'delivery'], default: 'user' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  
  // Wallet & Referral System
  walletBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  referralRewarded: { type: Boolean, default: false }
}, { timestamps: true });

// Exporting the model with a slight tweak to ensure HMR and schema updates work in Next.js
export const User = models.User || model('User', UserSchema);

// If the model is already registered, this won't update the schema until the server restarts.
// However, in development, it's often better to just use:
// export const User = mongoose.models.User || mongoose.model("User", UserSchema);
