import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const deliveryUser = await User.findOne({ email: session.user.email });
    if (!deliveryUser || (deliveryUser.role !== 'delivery' && deliveryUser.role !== 'admin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Orders assigned to this user that are not delivered/cancelled
    const orders = await Order.find({ 
      assignedTo: deliveryUser._id,
      status: { $nin: ['delivered', 'cancelled'] }
    })
    .populate('user', 'name email address')
    .sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Delivery API GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const deliveryUser = await User.findOne({ email: session.user.email });
    if (!deliveryUser || (deliveryUser.role !== 'delivery' && deliveryUser.role !== 'admin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, status, paymentStatus } = await request.json();

    const order = await Order.findOne({ _id: orderId, assignedTo: deliveryUser._id });
    if (!order) {
      return NextResponse.json({ error: "Order not found or not assigned to you" }, { status: 404 });
    }

    if (status) {
      order.status = status;
      if (status === 'delivered') {
        order.deliveredAt = new Date();
        order.paymentStatus = 'paid'; // Auto-mark as paid on delivery for COD/Logic
      }
    }
    
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    return NextResponse.json({ message: "Order updated successfully", order });
  } catch (error: any) {
    console.error("Delivery API PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
