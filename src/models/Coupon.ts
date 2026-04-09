import mongoose, { Schema, model, models } from 'mongoose';

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // e.g., 10 for 10% or 50 for ৳50
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null }, // Only used for percentage coupons
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: null }, // Total times it can be used
  usedCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Coupon = models.Coupon || model('Coupon', CouponSchema);
