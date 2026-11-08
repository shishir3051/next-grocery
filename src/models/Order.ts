import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  imageData: { type: String },
});

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, default: '' }, // optional in the checkout form
    phone: { type: String, required: true },
  },
  paymentProvider: { type: String, enum: ['stripe', 'cod', 'sslcommerz'], default: 'cod' },
  paymentProviderId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  deliveryNote: { type: String, default: null },
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  walletAmount: { type: Number, default: 0 }, // paid from the user's wallet; needed for refunds
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  dispatchedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  // Placed by a live-demo account (lib/demo.ts): never reserves real stock or coupon uses,
  // and is cleaned up automatically.
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes to improve query performance for Dashboard analytics
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ user: 1 });

export const Order = models.Order || model('Order', OrderSchema);
