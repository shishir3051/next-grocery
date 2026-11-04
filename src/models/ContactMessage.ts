import { Schema, model, models } from "mongoose";

/** Topics offered on the contact form. */
export const CONTACT_SUBJECTS = [
  "Order difficulty",
  "Delivery delay",
  "Product quality issue",
  "Account support",
  "Other / feedback",
] as const;

export const CONTACT_STATUSES = ["new", "read", "replied", "closed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

const ReplySchema = new Schema(
  {
    body: { type: String, required: true, maxlength: 5000 },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentByName: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** A message sent through /contact, and the admin replies to it (sent by email). */
const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, default: "", maxlength: 30 },
    subject: { type: String, enum: CONTACT_SUBJECTS, required: true },
    orderRef: { type: String, default: "", maxlength: 40 },
    message: { type: String, required: true, maxlength: 3000 },
    status: { type: String, enum: CONTACT_STATUSES, default: "new" },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null }, // set when sent while signed in
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = models.ContactMessage || model("ContactMessage", ContactMessageSchema);

/** Short human-friendly reference shown to the customer, e.g. "#A1B2C3". */
export const contactReference = (id: unknown) => `#${String(id).slice(-6).toUpperCase()}`;
