import mongoose, { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  icon: { type: String, default: '' },
  level: { type: Number, default: 0 },
});

export const Category = models.Category || model('Category', CategorySchema);

const ProductSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  unit: { type: String, required: true }, // e.g., '1 kg', '500 gm', '1 pc'
  images: [{ type: String }],
  imageData: { type: String, required: false },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  stock: { type: Number, default: 0 },
  isHalal: { type: Boolean, default: false },
  isOrganic: { type: Boolean, default: false },
  ratings: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Product = models.Product || model('Product', ProductSchema);
