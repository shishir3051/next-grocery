import mongoose, { Schema, model, models } from 'mongoose';

const HeroSlideSchema = new Schema({
  title: { type: String, required: true },
  highlight: { type: String, default: '' },
  subtitle: { type: String, required: true },
  ctaLabel: { type: String, default: 'Shop Now' },
  ctaLink: { type: String, default: 'all' },
  image: { type: String, default: '' }, // Can be URL or Base64
  gradient: { type: String, default: 'from-teal-600 via-emerald-600 to-teal-800' },
  accentColor: { type: String, default: 'text-emerald-300' },
  decorColor: { type: String, default: 'bg-emerald-400/20' },
  emoji: { type: String, default: '🥦' },
  tag: { type: String, default: '' },
  tagColor: { type: String, default: 'bg-emerald-500/30 text-emerald-100' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const HeroSlide = models.HeroSlide || model('HeroSlide', HeroSlideSchema);
