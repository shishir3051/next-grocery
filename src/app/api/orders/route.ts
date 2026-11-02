import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
import { User } from "@/models/User";
import {
  parseOrderRequest,
  buildOrderQuote,
  reserveStock,
  releaseStock,
  consumeCoupon,
  releaseCoupon,
  debitWallet,
  creditWallet,
} from "@/lib/orders";
import { roundMoney } from "@/lib/pricing";

/** Places a Cash-on-Delivery order (optionally part- or fully-paid from the wallet). */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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

    // 1. Validate input and price the order from the database (client totals are ignored)
    const parsed = parseOrderRequest(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const quoted = await buildOrderQuote(parsed.value, settings);
    if (!quoted.ok) return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    const quote = quoted.value;

    // 2. Apply side effects atomically, undoing earlier steps if a later one fails.
    //    (A MongoDB transaction would be cleaner; this works without a replica set.)
    if (!(await reserveStock(quote.items))) {
      return NextResponse.json({ error: "Some items just went out of stock. Please review your cart." }, { status: 409 });
    }

    if (quote.couponId && !(await consumeCoupon(quote.couponId))) {
      await releaseStock(quote.items);
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 409 });
    }

    const walletAmount = parsed.value.useWallet ? await debitWallet(userId, quote.total) : 0;
    if (walletAmount === null) {
      await releaseStock(quote.items);
      if (quote.couponId) await releaseCoupon(quote.couponId);
      return NextResponse.json({ error: "Your wallet balance changed. Please try again." }, { status: 409 });
    }

    const amountToPay = roundMoney(Math.max(0, quote.total - walletAmount));

    try {
      const order = await Order.create({
        user: userId,
        items: quote.items,
        totalAmount: amountToPay,
        shippingAddress: parsed.value.shippingAddress,
        status: 'pending',
        paymentProvider: 'cod',
        // Fully covered by the wallet means nothing is left to collect on delivery.
        paymentStatus: amountToPay === 0 ? 'paid' : 'unpaid',
        paidAt: amountToPay === 0 ? new Date() : null,
        deliveryNote: parsed.value.deliveryNote,
        couponCode: quote.couponCode,
        discountAmount: quote.discount,
        walletAmount,
      });

      return NextResponse.json({ success: true, orderId: order._id }, { status: 201 });
    } catch (error) {
      await releaseStock(quote.items);
      if (quote.couponId) await releaseCoupon(quote.couponId);
      await creditWallet(userId, walletAmount);
      throw error;
    }
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .populate('items.productId');

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
