import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
import { User } from "@/models/User";
import { parseOrderRequest, buildOrderQuote, consumeCoupon, releaseCoupon } from "@/lib/orders";
import { SSLCOMMERZ_INIT_URL } from "@/lib/sslcommerz";
import { checkRateLimit } from "@/lib/rateLimit";
import { readJsonObject, tooManyRequests } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await checkRateLimit(`ssl-init:${session.user.id}`, 10, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "Too many payment attempts. Please wait a few minutes.");

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

    // 1. Validate input and price the order from the database (client totals are ignored).
    //    Stock and coupon usage are applied only once the payment is validated (see ssl-status).
    const parsed = parseOrderRequest(await readJsonObject(request));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const quoted = await buildOrderQuote(parsed.value, settings);
    if (!quoted.ok) return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    const quote = quoted.value;
    const { shippingAddress } = parsed.value;

    // Unguessable id: it is the key the payment callback uses to find this order.
    const tran_id = `SSLC_${randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Reserve the coupon now so its usage limit holds across concurrent checkouts.
    // It is released again if the payment fails or is cancelled (see ssl-status).
    if (quote.couponId && !(await consumeCoupon(quote.couponId))) {
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 409 });
    }
    const releaseReservedCoupon = async () => { if (quote.couponId) await releaseCoupon(quote.couponId); };

    // Create provisional order
    const order = await Order.create({
      user: session.user.id,
      items: quote.items,
      totalAmount: quote.total,
      shippingAddress,
      status: 'pending',
      paymentProvider: 'sslcommerz',
      paymentProviderId: tran_id,
      paymentStatus: 'unpaid',
      deliveryNote: parsed.value.deliveryNote,
      couponCode: quote.couponCode,
      discountAmount: quote.discount,
    }).catch(async (error) => { await releaseReservedCoupon(); throw error; });

    // Construct form data as URLSearchParams
    const formData = new URLSearchParams();
    formData.append('store_id', process.env.SSLCOMMERZ_STORE_ID || '');
    formData.append('store_passwd', process.env.SSLCOMMERZ_STORE_PASSWORD || '');
    formData.append('total_amount', quote.total.toFixed(2));
    formData.append('currency', 'BDT');
    formData.append('tran_id', tran_id);
    formData.append('success_url', `${baseUrl}/api/payments/ssl-status?status=success`);
    formData.append('fail_url', `${baseUrl}/api/payments/ssl-status?status=fail`);
    formData.append('cancel_url', `${baseUrl}/api/payments/ssl-status?status=cancel`);
    formData.append('ipn_url', `${baseUrl}/api/payments/ssl-status?status=ipn`);

    // Customer Info
    formData.append('cus_name', session.user.name || 'Customer');
    formData.append('cus_email', session.user.email || 'customer@example.com');
    formData.append('cus_add1', shippingAddress.street);
    formData.append('cus_city', shippingAddress.city);
    formData.append('cus_postcode', shippingAddress.zipCode || '0000');
    formData.append('cus_country', 'Bangladesh');
    formData.append('cus_phone', shippingAddress.phone);

    // Shipping Info
    formData.append('shipping_method', 'Courier');
    formData.append('num_of_item', quote.items.length.toString());
    formData.append('product_name', 'Grocery Items');
    formData.append('product_category', 'Grocery');
    formData.append('product_profile', 'general');
    formData.append('ship_name', session.user.name || 'Customer');
    formData.append('ship_add1', shippingAddress.street);
    formData.append('ship_city', shippingAddress.city);
    formData.append('ship_state', shippingAddress.city);
    formData.append('ship_postcode', shippingAddress.zipCode || '0000');
    formData.append('ship_country', 'Bangladesh');

    let apiResponse;
    try {
      const gatewayResponse = await fetch(SSLCOMMERZ_INIT_URL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(15_000),
      });
      apiResponse = await gatewayResponse.json();
    } catch (error) {
      apiResponse = null;
      console.error("SSLCommerz gateway unreachable:", error);
    }

    if (apiResponse?.status === 'SUCCESS' && apiResponse?.GatewayPageURL) {
      return NextResponse.json({ url: apiResponse.GatewayPageURL });
    }

    // The customer never reached the gateway: cancel the provisional order and free the coupon.
    // Log the gateway's reason; don't show raw gateway messages to customers.
    console.error("SSLCommerz init failed:", apiResponse?.status, apiResponse?.failedreason);
    await Order.updateOne({ _id: order._id, paymentStatus: 'unpaid' }, { $set: { status: 'cancelled' } });
    await releaseReservedCoupon();
    return NextResponse.json({
      error: "Online payment is unavailable right now. Please try again or choose cash on delivery.",
    }, { status: 502 });
  } catch (error) {
    console.error("SSLCommerz Init Error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
