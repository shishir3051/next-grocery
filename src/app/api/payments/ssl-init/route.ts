import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";
import { requireUser } from "@/lib/authGuard";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
import { parseOrderRequest, buildOrderQuote, consumeCoupon, releaseCoupon } from "@/lib/orders";
import { SSLCOMMERZ_INIT_URL } from "@/lib/sslcommerz";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { jsonError, readJsonObject, tooManyRequests } from "@/lib/http";
import { isDemoModeEnabled } from "@/lib/demo";
import { demoShippingAddress } from "@/lib/demoOrder";

export async function POST(request: NextRequest) {
  try {
    // Any signed-in account that still exists; the role is read from the database.
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const user = auth.user;

    // Live demo: the shared demo customer's orders never reserve coupon uses or stock.
    const isDemoOrder = user.isDemo && isDemoModeEnabled();

    // Demo orders are deleted after 3 days with no refund trail, so the live demo may only
    // pay through the SSLCommerz sandbox, never with real money.
    if (isDemoOrder && process.env.IS_LIVE === 'true') {
      return jsonError("Online payment in the live demo works only with the SSLCommerz sandbox. Please choose cash on delivery.", 403);
    }

    // The shared demo customer is limited per visitor, so one visitor can't block the rest.
    const limitKey = isDemoOrder ? `ssl-init-demo:${clientIp(request.headers)}` : `ssl-init:${user.id}`;
    const limit = await checkRateLimit(limitKey, 10, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "Too many payment attempts. Please wait a few minutes.");

    // A new IP must not mean unlimited demo orders, so all demo visitors together also share
    // one ceiling (six visitors' worth). Checked second, so requests refused above don't count.
    if (isDemoOrder) {
      const overall = await checkRateLimit(`ssl-init-demo-all:${user.id}`, 60, 10 * 60 * 1000);
      if (!overall.ok) return tooManyRequests(overall.retryAfterSeconds, "The live demo is busy right now. Please try again in a few minutes.");
    }

    await dbConnect();

    // 0. Check Maintenance Mode
    const settings = await Settings.findOne();
    if (settings?.maintenanceMode) {
      if (user.role !== 'admin') {
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
    // Every demo visitor sees the demo customer's orders, so a demo order stores (and sends
    // to the gateway) a sample address and no note, never what was typed.
    const shippingAddress = isDemoOrder ? demoShippingAddress() : parsed.value.shippingAddress;

    // Unguessable id: it is the key the payment callback uses to find this order.
    const tran_id = `SSLC_${randomUUID()}`;
    // For the fail/cancel URLs (see cancelSignature). Computed before anything is reserved,
    // so a missing secret fails without side effects.
    const cancelSig = cancelSignature(tran_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const couponId = isDemoOrder ? null : quote.couponId;

    // Reserve the coupon now so its usage limit holds across concurrent checkouts.
    // It is released again if the payment fails or is cancelled (see ssl-status).
    if (couponId && !(await consumeCoupon(couponId))) {
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 409 });
    }
    const releaseReservedCoupon = async () => { if (couponId) await releaseCoupon(couponId); };

    // Create provisional order
    const order = await Order.create({
      user: user.id,
      items: quote.items,
      totalAmount: quote.total,
      shippingAddress,
      status: 'pending',
      paymentProvider: 'sslcommerz',
      paymentProviderId: tran_id,
      paymentStatus: 'unpaid',
      deliveryNote: isDemoOrder ? null : parsed.value.deliveryNote,
      couponCode: quote.couponCode,
      discountAmount: quote.discount,
      isDemo: isDemoOrder,
    }).catch(async (error) => { await releaseReservedCoupon(); throw error; });

    // Construct form data as URLSearchParams
    const formData = new URLSearchParams();
    formData.append('store_id', process.env.SSLCOMMERZ_STORE_ID || '');
    formData.append('store_passwd', process.env.SSLCOMMERZ_STORE_PASSWORD || '');
    formData.append('total_amount', quote.total.toFixed(2));
    formData.append('currency', 'BDT');
    formData.append('tran_id', tran_id);
    formData.append('success_url', `${baseUrl}/api/payments/ssl-status?status=success`);
    formData.append('fail_url', `${baseUrl}/api/payments/ssl-status?status=fail&sig=${cancelSig}`);
    formData.append('cancel_url', `${baseUrl}/api/payments/ssl-status?status=cancel&sig=${cancelSig}`);
    formData.append('ipn_url', `${baseUrl}/api/payments/ssl-status?status=ipn`);

    // Customer Info
    formData.append('cus_name', user.name || 'Customer');
    formData.append('cus_email', user.email || 'customer@example.com');
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
    formData.append('ship_name', user.name || 'Customer');
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

/**
 * HMAC of the tran_id, added to the fail/cancel URLs. ssl-status cancels an order only when
 * it matches, so a request that merely knows the tran_id (e.g. from an order list) can't.
 * Must stay in step with cancelSignatureMatches in ssl-status.
 */
function cancelSignature(tranId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to sign payment callbacks");
  return createHmac("sha256", secret).update(tranId).digest("hex");
}
