import { isDemoEmail, maskAddress, maskEmail, maskName, maskPhone } from "@/lib/demo";

/**
 * Hides real customers' personal data from live-demo accounts (lib/demo.ts).
 * Demo accounts' own data and demo orders are shown as they are, apart from payment
 * transaction ids, the names of the staff who replied to messages and the phone
 * numbers in messages.
 * Apply only when isDemoRestricted(user) is true.
 */

const HIDDEN = "Hidden in the demo.";
/** Shown instead of the real staff member who replied to a contact message. */
const STAFF_LABEL = "Store team";

type UserLike = { name?: string; email?: string; image?: string; address?: { street?: string; city?: string; zipCode?: string; phone?: string } } & Record<string, unknown>;

export function maskUser<T extends UserLike | null | undefined>(user: T): T {
  if (!user || typeof user !== "object" || isDemoEmail(user.email)) return user;
  return {
    ...user,
    name: maskName(user.name),
    email: maskEmail(user.email),
    image: "",
    address: maskAddress(user.address),
  } as T;
}

type OrderLike = { isDemo?: boolean; user?: unknown; shippingAddress?: UserLike["address"]; deliveryNote?: string | null } & Record<string, unknown>;

/** Also takes a Mongoose document (an update's result): spreading one would copy its internals. */
export function maskOrder<T extends OrderLike>(input: T): T {
  if (!input) return input;
  const doc = input as unknown as { toObject?: () => T };
  const order = typeof doc.toObject === "function" ? doc.toObject() : input;
  // The SSLCommerz tran_id is the key the unauthenticated payment callback (ssl-status)
  // acts on, so demo viewers never get it, not even for demo orders. The order has no
  // other payment secrets (no validation id or card data is stored).
  const safe = { ...order, paymentProviderId: null };
  if (order.isDemo) return safe as T;
  const user = order.user && typeof order.user === "object" ? maskUser(order.user as UserLike) : order.user;
  return {
    ...safe,
    user,
    shippingAddress: maskAddress(order.shippingAddress),
    deliveryNote: order.deliveryNote ? HIDDEN : order.deliveryNote,
  } as T;
}

type MessageLike = { name?: string; email?: string; phone?: string; orderRef?: string; message?: string; replies?: { body?: string; sentByName?: string }[] } & Record<string, unknown>;

export function maskMessage<T extends MessageLike>(message: T): T {
  if (!message) return message;
  // Replies are written by the real store staff, so their names are hidden on every
  // message, demo ones included.
  const replies = (message.replies ?? []).map(reply => ({ ...reply, sentByName: STAFF_LABEL }));
  // A demo address doesn't make the rest demo data: the contact form's phone field is
  // autofilled with the visitor's own number. (The seeded sample messages have no phone.)
  if (isDemoEmail(message.email)) return { ...message, phone: maskPhone(message.phone), replies } as T;
  return {
    ...message,
    name: maskName(message.name),
    email: maskEmail(message.email),
    phone: maskPhone(message.phone),
    orderRef: message.orderRef ? "•••" : "",
    message: "This message is from a real customer, so its text is hidden in the demo.",
    replies: replies.map(reply => ({ ...reply, body: HIDDEN })),
  } as T;
}
