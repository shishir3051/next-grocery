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
}, { timestamps: true });

// Delete cached model to ensure schema changes (like OTP fields) are always applied
if (models.User) {
  delete mongoose.connection.models['User'];
}
export const User = model('User', UserSchema);
