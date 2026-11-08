import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { isDemoRestricted, requireRole } from "@/lib/authGuard";
import { maskOrder } from "@/lib/demoMask";
import { badRequest, jsonError, readJsonObject, serverError } from "@/lib/http";
import { isObjectId } from "@/lib/validation";
import { transitionOrder } from "@/lib/orderStatus";

/** Orders assigned to the signed-in rider that are still out for delivery. */
export async function GET() {
  try {
    const auth = await requireRole("delivery", "admin");
    if ("response" in auth) return auth.response;

    const orders = await Order.find({
      assignedTo: auth.user.id,
      status: { $nin: ['delivered', 'cancelled'] }
    })
      .select("-items.imageData")
      .populate('user', 'name email address')
      .sort({ createdAt: -1 })
      .lean();

    // Live demo: real customers' details are masked for the demo rider.
    const visible = isDemoRestricted(auth.user) ? orders.map(o => maskOrder(o as Record<string, unknown>)) : orders;
    return NextResponse.json({ orders: visible });
  } catch (error) {
    return serverError(error, "Delivery orders fetch error");
  }
}

/**
 * A rider can only mark one of their own shipped orders as delivered. Cash-on-delivery
 * orders become paid at that moment; online orders keep the status the payment
 * gateway confirmed. Riders can't set any other status or payment state.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole("delivery", "admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    const orderId = body?.orderId;
    if (!isObjectId(orderId)) return badRequest("Order ID required");
    if (body?.status !== "delivered") return badRequest("Riders can only mark an order as delivered");

    // Live demo: the demo rider can complete demo orders only.
    const restricted = isDemoRestricted(auth.user);
    const filter: Record<string, unknown> = { assignedTo: auth.user.id };
    if (restricted) filter.isDemo = true;

    const result = await transitionOrder(orderId, "delivered", { filter });
    if ("error" in result) {
      return jsonError(result.status === 404 ? "Order not found or not assigned to you" : result.error, result.status);
    }
    // Masked like the list above, so the demo rider never gets the payment id.
    const order = restricted ? maskOrder(result.order as Record<string, unknown>) : result.order;
    return NextResponse.json({ message: "Order updated successfully", order });
  } catch (error) {
    return serverError(error, "Delivery order update error");
  }
}
