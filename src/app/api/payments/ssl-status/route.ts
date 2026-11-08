import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Coupon } from "@/models/Coupon";
import { Product } from "@/models/Product";
import { validateSslPayment } from "@/lib/sslcommerz";
import { reserveStock, releaseCoupon } from "@/lib/orders";

/**
 * SSLCommerz callback for success / fail / cancel redirects and the IPN.
 *
 * Nothing in this request is trusted: an order is marked paid only after the
 * SSLCommerz validation API confirms the `val_id`, and the confirmed
 * transaction id, amount and currency match the order we created.
 * The coupon was already reserved in ssl-init; it is released on fail/cancel.
 * A fail/cancel callback cancels the order only when it carries the signature ssl-init
 * put on those URLs; the IPN and the success redirect never cancel anything.
 */
export async function POST(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const origin = request.nextUrl.origin;
  const isIpn = status === 'ipn';

  const respond = (paid: boolean) => {
    if (isIpn) return NextResponse.json({ received: true, paid });
    return paid
      ? NextResponse.redirect(new URL(`/orders?session=success`, origin), 303)
      : NextResponse.redirect(new URL(`/checkout?status=${status === 'cancel' ? 'cancel' : 'fail'}`, origin), 303);
  };

  try {
    // SSLCommerz sends data in form-data/urlencoded format
    const formData = await request.formData();
    await dbConnect();

    if (status === 'fail' || status === 'cancel') {
      // Without a valid signature this is answered like any failed payment, and nothing changes.
      await cancelUnpaidOrder(formData.get('tran_id'), request.nextUrl.searchParams.get('sig'));
      return respond(false);
    }
    if (status !== 'success' && !isIpn) return respond(false);

    const valId = formData.get('val_id');
    if (typeof valId !== 'string' || !valId) return respond(false);

    const payment = await validateSslPayment(valId);
    if (!payment) return respond(false);

    const order = await Order.findOne({ paymentProvider: 'sslcommerz', paymentProviderId: payment.tranId });
    if (!order) return respond(false);
    if (order.paymentStatus === 'paid') return respond(true); // success redirect + IPN both arrive

    const amountMatches = Math.abs(payment.amount - order.totalAmount) < 0.01 && payment.currency === 'BDT';
    if (!amountMatches) {
      console.error(`SSLCommerz amount mismatch for order ${order._id}: paid ${payment.amount} ${payment.currency}, expected ${order.totalAmount} BDT`);
      return respond(false);
    }

    // Atomic transition so the redirect and the IPN can't both apply side effects.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'unpaid', status: 'pending' },
      { $set: { paymentStatus: 'paid', paidAt: new Date(), status: 'processing' } },
      { new: true }
    );

    if (!paidOrder) {
      // Money arrived for an order that was cancelled in the meantime: record the payment
      // but don't resurrect the order; it needs a refund.
      const recorded = await Order.findOneAndUpdate(
        { _id: order._id, paymentStatus: 'unpaid', status: 'cancelled' },
        { $set: { paymentStatus: 'paid', paidAt: new Date() } }
      );
      if (recorded) console.error(`Order ${order._id} was paid after being cancelled; refund required`);
      return respond(true);
    }

    // Live-demo orders never take real stock (lib/demo.ts).
    const items = paidOrder.isDemo
      ? []
      : paidOrder.items.map((i: { productId: unknown; quantity: number }) => ({ productId: String(i.productId), quantity: i.quantity }));
    if (!(await reserveStock(items))) {
      // Money is already captured, so keep the order, record the stock as owed
      // (it may go negative) and flag it for manual review.
      console.error(`Order ${paidOrder._id} was paid but stock ran out; needs manual review`);
      await Promise.all(items.map((i: { productId: string; quantity: number }) =>
        Product.updateOne({ _id: i.productId }, { $inc: { stock: -i.quantity } })
      ));
    }

    return respond(true);
  } catch (error) {
    console.error("SSL Status Error:", error);
    if (isIpn) return NextResponse.json({ received: false }, { status: 500 });
    // The payment may still be fine (e.g. the validation API timed out); the IPN will
    // settle it, so send the customer to their orders rather than back to checkout.
    return NextResponse.redirect(new URL(status === 'success' ? `/orders?session=pending` : `/checkout?status=error`, origin), 303);
  }
}

/**
 * Cancels the provisional order for a failed/cancelled payment and frees its coupon.
 * The tran_id alone is not proof (it can leak, e.g. through an order list), so this also
 * needs the signature that only the fail/cancel URLs from ssl-init carry.
 */
async function cancelUnpaidOrder(tranId: FormDataEntryValue | null, sig: string | null) {
  if (typeof tranId !== 'string' || !tranId || !cancelSignatureMatches(tranId, sig)) return;
  const cancelled = await Order.findOneAndUpdate(
    { paymentProvider: 'sslcommerz', paymentProviderId: tranId, paymentStatus: 'unpaid', status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
  // Demo orders never consumed a coupon use, so there is none to give back.
  if (cancelled?.couponCode && !cancelled.isDemo) {
    const coupon = await Coupon.findOne({ code: cancelled.couponCode }).select('_id').lean<{ _id: unknown }>();
    if (coupon) await releaseCoupon(String(coupon._id));
  }
}

/** Same HMAC as cancelSignature in ssl-init, compared in constant time. */
function cancelSignatureMatches(tranId: string, sig: string | null): boolean {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || !sig) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(tranId).digest("hex"));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
