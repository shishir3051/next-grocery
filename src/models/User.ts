import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  // Stored lower-case, and Mongoose lower-cases query filters on this field too, so
  // "Ana@x.com" and "ana@x.com" are one account (run scripts/normalize-emails.mjs once
  // on databases created before this rule).
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // Google account id ("sub") once the user has signed in with Google.
  googleId: { type: String, unique: true, sparse: true },
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
  otpAttempts: { type: Number, default: 0 }, // failed guesses for the current OTP

  // Password reset ("Forgot password?"), separate from email verification
  resetOtp: { type: String, default: null }, // keyed hash of the code, never the code itself
  resetOtpExpiry: { type: Date, default: null },
  resetOtpAttempts: { type: Number, default: 0 }, // wrong guesses for the current code
  // Rolling per-account limits (see RESET_* in lib/otp.ts)
  resetWindowStart: { type: Date, default: null },
  resetCodesSent: { type: Number, default: 0 },
  resetFailures: { type: Number, default: 0 },
  // Sessions issued before this moment are rejected (see lib/auth.ts)
  passwordChangedAt: { type: Date, default: null },
  
  // Wallet & Referral System
  walletBalance: { type: Number, default: 0, min: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  referralRewarded: { type: Boolean, default: false }
}, { timestamps: true });

// Exporting the model with a slight tweak to ensure HMR and schema updates work in Next.js
export const User = models.User || model('User', UserSchema);

// If the model is already registered, this won't update the schema until the server restarts.
// However, in development, it's often better to just use:
// export const User = mongoose.models.User || mongoose.model("User", UserSchema);
