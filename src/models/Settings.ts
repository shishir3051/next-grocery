import mongoose, { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema({
  storeName: { type: String, default: 'Fresh Grocery' },
  supportEmail: { type: String, default: 'support@freshgrocery.com' },
  supportPhone: { type: String, default: '' },
  deliveryFee: { type: Number, default: 50 },
  minFreeDelivery: { type: Number, default: 500 },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

export const Settings = models.Settings || model('Settings', SettingsSchema);
