import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { requireRole } from "@/lib/authGuard";
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

    return NextResponse.json({ orders });
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

    const result = await transitionOrder(orderId, "delivered", { filter: { assignedTo: auth.user.id } });
    if ("error" in result) {
      return jsonError(result.status === 404 ? "Order not found or not assigned to you" : result.error, result.status);
    }
    return NextResponse.json({ message: "Order updated successfully", order: result.order });
  } catch (error) {
    return serverError(error, "Delivery order update error");
  }
}
