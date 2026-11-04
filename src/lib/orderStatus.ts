import { Order } from "@/models/Order";
import { Coupon } from "@/models/Coupon";
import { releaseStock, releaseCoupon, creditWallet } from "@/lib/orders";

/**
 * Order status rules, shared by the admin and delivery routes.
 *
 *   pending → processing → shipped → delivered
 *      └──────────┴───────────┴──→ cancelled
 *
 * "delivered" and "cancelled" are final. Every change is applied with a filter on the
 * current status, so two people editing the same order can't both apply side effects.
 */

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);

export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from]?.includes(to) ?? false;

interface OrderForCancel {
  _id: unknown;
  user: unknown;
  status: OrderStatus;
  paymentProvider: string;
  paymentStatus: string;
  items: { productId: unknown; quantity: number }[];
  couponCode?: string | null;
  walletAmount?: number;
}

/**
 * Undoes what placing the order reserved: stock, the coupon use and wallet credit.
 * - Cash on delivery reserves stock, coupon and wallet when the order is placed.
 * - SSLCommerz reserves the coupon at checkout and stock only once payment is confirmed.
 * Money paid online is NOT refunded automatically; that is logged for manual refund.
 */
async function releaseReservations(order: OrderForCancel) {
  const stockReserved = order.paymentProvider === "cod" || order.paymentStatus === "paid";
  if (stockReserved) {
    await releaseStock(order.items.map(i => ({ productId: String(i.productId), quantity: i.quantity })));
  }
  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode }).select("_id").lean<{ _id: unknown }>();
    if (coupon) await releaseCoupon(String(coupon._id));
  }
  if (order.walletAmount && order.walletAmount > 0) {
    await creditWallet(String(order.user), order.walletAmount);
  }
  if (order.paymentProvider !== "cod" && order.paymentStatus === "paid") {
    console.error(`Order ${order._id} was cancelled after online payment; refund it in the SSLCommerz panel`);
  }
}

/**
 * Moves an order to `to` if that is allowed from its current status.
 * Returns the updated order, or an error message.
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  extra: { filter?: Record<string, unknown>; set?: Record<string, unknown> } = {}
): Promise<{ order: unknown } | { error: string; status: number }> {
  const current = await Order.findOne({ _id: orderId, ...extra.filter }).lean<OrderForCancel>();
  if (!current) return { error: "Order not found", status: 404 };
  if (current.status === to && !extra.set) return { order: current };
  if (!canTransition(current.status, to)) {
    return { error: `An order that is ${current.status} can't be changed to ${to}`, status: 409 };
  }
  if (to !== "cancelled" && current.paymentProvider !== "cod" && current.paymentStatus !== "paid") {
    return { error: "This online payment hasn't been confirmed yet, so the order can't be fulfilled", status: 409 };
  }

  const set: Record<string, unknown> = { status: to, ...extra.set };
  if (to === "delivered") {
    set.deliveredAt = new Date();
    // Cash collected on delivery. Online orders are only ever marked paid by the
    // validated payment callback, never by a status change.
    if (current.paymentProvider === "cod") {
      set.paymentStatus = "paid";
      set.paidAt = new Date();
    }
  }

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status, ...extra.filter },
    { $set: set },
    { new: true, runValidators: true }
  );
  if (!updated) return { error: "The order was changed by someone else. Refresh and try again.", status: 409 };

  if (to === "cancelled") await releaseReservations(current);
  return { order: updated };
}
