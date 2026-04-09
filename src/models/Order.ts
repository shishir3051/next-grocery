import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  imageData: { type: String },
});

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
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
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  dispatchedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true });

export const Order = models.Order || model('Order', OrderSchema);
