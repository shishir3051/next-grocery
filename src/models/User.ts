import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
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

// Auto-generate referral code pre-save if not exists
UserSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `FRESH-${randomStr}`;
  }
  next();
});

// Delete cached model to ensure schema changes (like OTP fields) are always applied
if (models.User) {
  delete mongoose.connection.models['User'];
}
export const User = model('User', UserSchema);
