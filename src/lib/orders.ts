import { isObjectIdOrHexString } from "mongoose";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";
import { User } from "@/models/User";
import { getEffectivePrice, roundMoney } from "@/lib/pricing";

/**
 * Shared, server-side order logic used by both checkout routes
 * (/api/orders for COD and /api/payments/ssl-init for SSLCommerz).
 *
 * Rule: never trust prices, names, images or totals sent by the browser.
 * The client only tells us WHICH products and HOW MANY; everything else
 * is rebuilt here from the database.
 */

const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 100;
const MAX_TEXT_LENGTH = 300;

const DEFAULT_DELIVERY_FEE = 50;
const DEFAULT_FREE_DELIVERY_MIN = 500;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; status: number };

const fail = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status });

export interface OrderRequest {
  items: { productId: string; quantity: number }[];
  shippingAddress: { street: string; city: string; zipCode: string; phone: string };
  couponCode: string | null;
  deliveryNote: string | null;
  useWallet: boolean;
}

export interface OrderQuote {
  items: { productId: string; name: string; price: number; quantity: number; image?: string; imageData?: string }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponId: string | null;
  couponCode: string | null;
  total: number;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= MAX_TEXT_LENGTH;

/** Validates the raw JSON body of a checkout request. */
export function parseOrderRequest(body: unknown): Result<OrderRequest> {
  if (!body || typeof body !== "object") return fail("Invalid request body");
  const { items, shippingAddress, couponCode, deliveryNote, useWallet } = body as Record<string, unknown>;

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINE_ITEMS) {
    return fail("Your cart is empty or has too many items");
  }

  // Merge duplicate lines so the same product can't bypass the stock check twice.
  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = item?.quantity;
    if (typeof item?.productId !== "string" || !isObjectIdOrHexString(item.productId)) return fail("Invalid product in cart");
    // Lower-case so the key matches String(product._id) when we look the product up.
    const productId = item.productId.toLowerCase();
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      return fail(`Quantity must be a whole number between 1 and ${MAX_QUANTITY_PER_ITEM}`);
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_ITEM) return fail(`You can order at most ${MAX_QUANTITY_PER_ITEM} of one product`);
  }

  const address = (shippingAddress || {}) as Record<string, unknown>;
  if (!isNonEmptyString(address.street) || !isNonEmptyString(address.city) || !isNonEmptyString(address.phone)) {
    return fail("Please provide a street, city and phone number");
  }
  const zipCode = typeof address.zipCode === "string" ? address.zipCode.slice(0, 20) : "";

  if (couponCode != null && (typeof couponCode !== "string" || couponCode.length > 40)) return fail("Invalid coupon code");
  if (deliveryNote != null && (typeof deliveryNote !== "string" || deliveryNote.length > 500)) return fail("Delivery note is too long");

  return {
    ok: true,
    value: {
      items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })),
      shippingAddress: { street: address.street.trim(), city: address.city.trim(), zipCode: zipCode.trim(), phone: address.phone.trim() },
      couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
      deliveryNote: deliveryNote || null,
      useWallet: useWallet === true,
    },
  };
}

/**
 * Discount a coupon gives on a goods subtotal. Shared by checkout preview
 * (/api/coupons/validate) and order creation so both always agree.
 * A coupon can never make the goods cost less than zero.
 */
export function computeCouponDiscount(
  coupon: { discountType: string; discountValue: number; maxDiscount?: number | null },
  subtotal: number
): number {
  let discount = coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.discountType === "percentage" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return roundMoney(Math.min(Math.max(discount, 0), subtotal));
}

/** The coupon fields the validity rules look at. */
export interface CouponRules {
  isActive?: boolean | null;
  startDate?: Date | string | null;
  expiryDate?: Date | string | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usedCount?: number | null;
}

/**
 * Why a coupon can't be used on this goods subtotal right now, or null when it can.
 * The single rule behind the cart preview (/api/coupons/validate) and order creation, so
 * the two never disagree. A usage limit counts only when it is 1 or more: the admin panel
 * saves "no limit" as null, and older data may hold 0 for the same meaning.
 */
export function couponProblem(coupon: CouponRules | null | undefined, subtotal: number, now: Date = new Date()): string | null {
  if (!coupon || coupon.isActive === false) return "Invalid or expired coupon code";
  if (coupon.startDate && new Date(coupon.startDate) > now) return "Invalid or expired coupon code";
  if (!coupon.expiryDate || new Date(coupon.expiryDate) < now) return "Invalid or expired coupon code";
  if ((coupon.usageLimit ?? 0) > 0 && (coupon.usedCount ?? 0) >= (coupon.usageLimit ?? 0)) return "Coupon usage limit reached";
  const minimum = coupon.minOrderAmount ?? 0;
  if (subtotal < minimum) return `Min order for this coupon is ৳${minimum}`;
  return null;
}

/**
 * Prices the order from database values: product prices, delivery settings and coupon.
 * Stock is pre-checked here for a friendly error; the real guarantee is the
 * atomic reservation in reserveStock().
 */
export async function buildOrderQuote(
  request: OrderRequest,
  settings: { deliveryFee?: number | null; minFreeDelivery?: number | null } | null
): Promise<Result<OrderQuote>> {
  const products = await Product.find({ _id: { $in: request.items.map(i => i.productId) } })
    .select("name price discountPrice stock images imageData")
    .lean<{ _id: unknown; name: string; price: number; discountPrice?: number; stock: number; images?: string[]; imageData?: string }[]>();
  const byId = new Map(products.map(p => [String(p._id), p]));

  const items: OrderQuote["items"] = [];
  let subtotal = 0;
  for (const { productId, quantity } of request.items) {
    const product = byId.get(productId);
    if (!product) return fail("A product in your cart is no longer available");
    if (product.stock < quantity) return fail(`Insufficient stock for ${product.name}. Available: ${Math.max(0, product.stock)}`);

    const price = getEffectivePrice(product);
    subtotal += price * quantity;
    items.push({ productId, name: product.name, price, quantity, image: product.images?.[0], imageData: product.imageData });
  }
  subtotal = roundMoney(subtotal);
  if (subtotal <= 0) return fail("Order total must be greater than zero");

  let discount = 0;
  let couponId: string | null = null;
  if (request.couponCode) {
    const coupon = await Coupon.findOne({ code: request.couponCode })
      .lean<CouponRules & { _id: unknown; discountType: string; discountValue: number; maxDiscount?: number | null }>();

    if (!coupon || couponProblem(coupon, subtotal)) {
      return fail("This coupon is no longer valid for your order. Please remove it and try again.");
    }

    discount = computeCouponDiscount(coupon, subtotal);
    couponId = String(coupon._id);
  }

  const minFreeDelivery = settings?.minFreeDelivery ?? DEFAULT_FREE_DELIVERY_MIN;
  const deliveryFee = subtotal >= minFreeDelivery ? 0 : (settings?.deliveryFee ?? DEFAULT_DELIVERY_FEE);

  return {
    ok: true,
    value: {
      items,
      subtotal,
      deliveryFee,
      discount,
      couponId,
      couponCode: couponId ? request.couponCode : null,
      total: roundMoney(subtotal + deliveryFee - discount),
    },
  };
}

/**
 * Atomically decrements stock for every line, only if enough stock remains.
 * If any line fails, the lines already reserved are put back.
 */
export async function reserveStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
  const reserved: typeof items = [];
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (!updated) {
      await releaseStock(reserved);
      return false;
    }
    reserved.push(item);
  }
  return true;
}

export async function releaseStock(items: { productId: string; quantity: number }[]): Promise<void> {
  await Promise.all(items.map(i => Product.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } })));
}

/** Atomically counts one use of a coupon, respecting its usage limit (null or 0 = no limit, as in couponProblem). */
export async function consumeCoupon(couponId: string): Promise<boolean> {
  const updated = await Coupon.findOneAndUpdate(
    { _id: couponId, $or: [{ usageLimit: null }, { usageLimit: { $lte: 0 } }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
    { $inc: { usedCount: 1 } }
  );
  return Boolean(updated);
}

export async function releaseCoupon(couponId: string): Promise<void> {
  await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

/**
 * Atomically takes up to `maxAmount` from the user's wallet.
 * Returns the amount actually deducted (0 if the wallet is empty),
 * or null if the balance changed concurrently and the caller should retry.
 */
export async function debitWallet(userId: string, maxAmount: number): Promise<number | null> {
  const user = await User.findById(userId).select("walletBalance").lean<{ walletBalance?: number }>();
  const amount = roundMoney(Math.min(Math.max(user?.walletBalance || 0, 0), maxAmount));
  if (amount <= 0) return 0;

  const updated = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } }
  );
  return updated ? amount : null;
}

export async function creditWallet(userId: string, amount: number): Promise<void> {
  if (amount > 0) await User.updateOne({ _id: userId }, { $inc: { walletBalance: amount } });
}
