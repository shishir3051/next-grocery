import { Schema, model, models } from "mongoose";

/**
 * One counter per (rate-limit key, time window). MongoDB deletes each document
 * automatically once its window has ended (TTL index on expiresAt).
 */
const RateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = models.RateLimit || model("RateLimit", RateLimitSchema);
