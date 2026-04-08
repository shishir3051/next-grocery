import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 0. Check Maintenance Mode
    const settings = await Settings.findOne();
    if (settings?.maintenanceMode) {
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser?.role !== 'admin') {
        return NextResponse.json({ 
          error: "Store is currently under maintenance. Please try again later." 
        }, { status: 503 });
      }
    }

    const { items, totalAmount, shippingAddress, paymentProvider, useWallet } = await request.json();


    if (!items || !totalAmount || !shippingAddress) {
      return NextResponse.json({ error: "Missing order details" }, { status: 400 });
    }

    await dbConnect();

    let calculatedSubTotal = 0;

    // 0. Verify stock availability and calculate true subtotal
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product?.name || 'an item'}. Available: ${product?.stock || 0}` 
        }, { status: 400 });
      }
      calculatedSubTotal += (product.discountPrice || product.price) * item.quantity;
    }

    const deliveryFee = calculatedSubTotal >= (settings?.minFreeDelivery || 500) ? 0 : (settings?.deliveryFee || 50);
    const calculatedTotal = calculatedSubTotal + deliveryFee;

    const user = await User.findById((session.user as any).id);
    let finalAmountToPay = calculatedTotal;
    let walletDeducted = 0;

    if (useWallet && user && user.walletBalance > 0) {
      if (user.walletBalance >= calculatedTotal) {
        walletDeducted = calculatedTotal;
        finalAmountToPay = 0;
      } else {
        walletDeducted = user.walletBalance;
        finalAmountToPay = calculatedTotal - user.walletBalance;
      }
      user.walletBalance -= walletDeducted;
      await user.save();
    }

    // 1. Decrement Stock for each item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: (session.user as any).id,
      items,
      totalAmount: finalAmountToPay,
      shippingAddress,
      status: 'pending',
      paymentProvider: paymentProvider || 'cod',
      paymentStatus: 'unpaid'
    });

    return NextResponse.json({ success: true, orderId: order._id }, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ user: (session.user as any).id })
      .sort({ createdAt: -1 })
      .populate('items.productId');

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
