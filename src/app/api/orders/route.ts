import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
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
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { readJsonObject, tooManyRequests } from "@/lib/http";
import { isDemoModeEnabled } from "@/lib/demo";
import { demoShippingAddress } from "@/lib/demoOrder";
import { cleanupDemoOrders } from "@/lib/orderStatus";

const MAX_OPEN_COD_ORDERS = 5;

/** Places a Cash-on-Delivery order (optionally part- or fully-paid from the wallet). */
export async function POST(request: NextRequest) {
  try {
    // Any signed-in account that still exists; the role is read from the database.
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const userId = auth.user.id;

    // Live demo: the demo customer is shared by every visitor. Its orders never reserve
    // real stock, coupon uses or wallet credit, and old ones are tidied away first.
    const isDemoOrder = auth.user.isDemo && isDemoModeEnabled();

    // Abuse limits: COD orders reserve stock immediately, so one account must not be
    // able to tie up the inventory with a flood of orders it never intends to receive.
    // The shared demo customer is limited per visitor, so one visitor can't block the rest.
    const limitKey = isDemoOrder ? `order-demo:${clientIp(request.headers)}` : `order:${userId}`;
    const limit = await checkRateLimit(limitKey, 10, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "Too many orders in a short time. Please wait a few minutes.");

    // A new IP must not mean unlimited demo orders, so all demo visitors together also share
    // one ceiling (six visitors' worth). Checked second, so requests refused above don't count.
    if (isDemoOrder) {
      const overall = await checkRateLimit(`order-demo-all:${userId}`, 60, 10 * 60 * 1000);
      if (!overall.ok) return tooManyRequests(overall.retryAfterSeconds, "The live demo is busy right now. Please try again in a few minutes.");
    }

    await dbConnect();

    if (isDemoOrder) await cleanupDemoOrders(userId);

    // The cap protects reserved stock, which demo orders never take; on the shared demo
    // account it would only let some visitors' orders block everyone else's checkout.
    const openCodOrders = isDemoOrder ? 0 : await Order.countDocuments({ user: userId, paymentProvider: 'cod', status: 'pending' });
    if (openCodOrders >= MAX_OPEN_COD_ORDERS) {
      return NextResponse.json({
        error: `You already have ${MAX_OPEN_COD_ORDERS} orders waiting to be confirmed. Please wait for them to be processed.`,
      }, { status: 409 });
    }

    // 0. Check Maintenance Mode
    const settings = await Settings.findOne();
    if (settings?.maintenanceMode) {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ 
          error: "Store is currently under maintenance. Please try again later." 
        }, { status: 503 });
      }
    }

    // 1. Validate input and price the order from the database (client totals are ignored)
    const parsed = parseOrderRequest(await readJsonObject(request));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const quoted = await buildOrderQuote(parsed.value, settings);
    if (!quoted.ok) return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    const quote = quoted.value;

    // Every demo visitor sees the demo customer's orders, so a demo order stores a sample
    // address and no note, never what was typed (the typed address is still validated above).
    const shippingAddress = isDemoOrder ? demoShippingAddress() : parsed.value.shippingAddress;

    // 2. Apply side effects atomically, undoing earlier steps if a later one fails.
    //    (A MongoDB transaction would be cleaner; this works without a replica set.)
    //    Demo orders skip all three reservations (stock, coupon, wallet).
    const stockItems = isDemoOrder ? [] : quote.items;
    const couponId = isDemoOrder ? null : quote.couponId;

    if (!(await reserveStock(stockItems))) {
      return NextResponse.json({ error: "Some items just went out of stock. Please review your cart." }, { status: 409 });
    }

    if (couponId && !(await consumeCoupon(couponId))) {
      await releaseStock(stockItems);
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 409 });
    }

    const walletAmount = parsed.value.useWallet && !isDemoOrder ? await debitWallet(userId, quote.total) : 0;
    if (walletAmount === null) {
      await releaseStock(stockItems);
      if (couponId) await releaseCoupon(couponId);
      return NextResponse.json({ error: "Your wallet balance changed. Please try again." }, { status: 409 });
    }

    const amountToPay = roundMoney(Math.max(0, quote.total - walletAmount));

    try {
      const order = await Order.create({
        user: userId,
        items: quote.items,
        totalAmount: amountToPay,
        shippingAddress,
        status: 'pending',
        paymentProvider: 'cod',
        // Fully covered by the wallet means nothing is left to collect on delivery.
        paymentStatus: amountToPay === 0 ? 'paid' : 'unpaid',
        paidAt: amountToPay === 0 ? new Date() : null,
        deliveryNote: isDemoOrder ? null : parsed.value.deliveryNote,
        couponCode: quote.couponCode,
        discountAmount: quote.discount,
        walletAmount,
        isDemo: isDemoOrder,
      });

      return NextResponse.json({ success: true, orderId: order._id }, { status: 201 });
    } catch (error) {
      await releaseStock(stockItems);
      if (couponId) await releaseCoupon(couponId);
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
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    await dbConnect();

    // Only the signed-in user's own orders, and only the fields the order history needs.
    const orders = await Order.find({ user: auth.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('items.productId', 'name slug images unit')
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
