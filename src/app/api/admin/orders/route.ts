import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { demoReadOnly, isDemoRestricted, requireRole } from "@/lib/authGuard";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { maskOrder } from "@/lib/demoMask";
import { badRequest, jsonError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId } from "@/lib/validation";
import { isOrderStatus, transitionOrder } from "@/lib/orderStatus";

/**
 * Order management for admins.
 */
export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const orders = await Order.find()
      .populate('user', 'name email address')
      .sort({ createdAt: -1 })
      .lean();

    // Live demo: real customers' names, contacts and addresses are masked.
    const visible = isDemoRestricted(auth.user) ? orders.map(o => maskOrder(o as Record<string, unknown>)) : orders;
    return NextResponse.json({ orders: visible });
  } catch (error) {
    return serverError(error, "Admin orders fetch error");
  }
}

/**
 * Body: { orderId, status? } to change the status (see lib/orderStatus.ts for the rules),
 * { orderId, assignedTo } to hand the order to a delivery rider (marks it shipped), or
 * { orderId, paymentStatus: "paid" } to record cash received for a COD order.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    const orderId = body?.orderId;
    if (!isObjectId(orderId)) return badRequest("Order ID required");

    // Live demo: the demo admin may move only demo orders through the flow, and only to
    // the demo rider; every real order stays untouched.
    const restricted = isDemoRestricted(auth.user);
    if (restricted) {
      const target = await Order.findById(orderId).select("isDemo").lean<{ isDemo?: boolean }>();
      if (!target) return notFound("Order not found");
      if (!target.isDemo) return demoReadOnly();
    }
    // The changed order goes back masked for demo viewers, like every order they see.
    const orderUpdated = (order: unknown) => NextResponse.json({
      message: "Order updated successfully",
      order: restricted ? maskOrder(order as Record<string, unknown>) : order,
    });

    if (body?.assignedTo !== undefined) {
      if (!isObjectId(body.assignedTo)) return badRequest("Choose a delivery partner");
      // Live demo: the demo rider is the only possible assignee (not the demo admin itself).
      const riderRoles = restricted ? ["delivery"] : ["delivery", "admin"];
      const rider = await User.findOne({ _id: body.assignedTo, role: { $in: riderRoles } }).select("_id email").lean<{ _id: unknown; email: string }>();
      if (restricted && rider?.email !== DEMO_ACCOUNTS.rider.email) {
        return jsonError("In the live demo, demo orders can only be assigned to the demo rider.", 403);
      }
      if (!rider) return badRequest("That user is not a delivery partner");

      const order = await Order.findById(orderId).select("status").lean<{ status: string }>();
      if (!order) return notFound("Order not found");
      if (order.status === "shipped") {
        // Re-assigning an order that is already out for delivery.
        const updated = await Order.findOneAndUpdate(
          { _id: orderId, status: "shipped" },
          { $set: { assignedTo: body.assignedTo } },
          { new: true }
        );
        if (!updated) return jsonError("The order was changed by someone else. Refresh and try again.", 409);
        return orderUpdated(updated);
      }
      const result = await transitionOrder(orderId, "shipped", { set: { assignedTo: body.assignedTo, dispatchedAt: new Date() } });
      if ("error" in result) return jsonError(result.error, result.status);
      return orderUpdated(result.order);
    }

    if (body?.status !== undefined) {
      if (!isOrderStatus(body.status)) return badRequest("Invalid status");
      const result = await transitionOrder(orderId, body.status);
      if ("error" in result) return jsonError(result.error, result.status);
      return orderUpdated(result.order);
    }

    if (body?.paymentStatus !== undefined) {
      // Live demo: the demo admin changes only the status and rider of demo orders.
      if (restricted) return demoReadOnly();
      // Online payments are confirmed only by the SSLCommerz validation callback.
      if (body.paymentStatus !== "paid") return badRequest("Only recording a cash payment is allowed");
      const updated = await Order.findOneAndUpdate(
        { _id: orderId, paymentProvider: "cod", paymentStatus: "unpaid", status: { $ne: "cancelled" } },
        { $set: { paymentStatus: "paid", paidAt: new Date() } },
        { new: true }
      );
      if (!updated) return jsonError("Only unpaid cash-on-delivery orders can be marked paid", 409);
      return orderUpdated(updated);
    }

    return badRequest("Nothing to update");
  } catch (error) {
    return serverError(error, "Admin order update error");
  }
}
