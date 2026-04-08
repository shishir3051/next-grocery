import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  image: string;
  readTime: string;
  author: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: false, default: "" }, // Explicitly optional for desktop uploads
  imageData: { type: String }, // For direct uploads (Base64)
  readTime: { type: String, required: true },
  author: { type: String, default: 'FreshBasket Team' },
  isPublished: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const News = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);
