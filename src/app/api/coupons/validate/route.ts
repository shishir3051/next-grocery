import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import dbConnect from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { computeCouponDiscount, couponProblem, type CouponRules } from "@/lib/orders";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { readJsonObject, tooManyRequests } from "@/lib/http";
import { isDemoModeEnabled } from "@/lib/demo";

/** Cart preview of a coupon: same validity rule and discount maths as order creation. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    // Stops guessing coupon codes by brute force. The shared live-demo customer is limited
    // per visitor, so one visitor can't use up the limit for everyone else.
    const isDemo = auth.user.isDemo && isDemoModeEnabled();
    const limitKey = isDemo ? `coupon-validate-demo:${clientIp(request.headers)}` : `coupon-validate:${auth.user.id}`;
    const limit = await checkRateLimit(limitKey, 20, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "Too many coupon attempts. Please wait a few minutes.");

    const { code, subtotal } = (await readJsonObject(request)) ?? {};

    if (typeof code !== 'string' || !code || code.length > 40 || typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await dbConnect();

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() })
      .lean<CouponRules & { code: string; discountType: string; discountValue: number; maxDiscount?: number | null }>();

    const problem = couponProblem(coupon, subtotal);
    if (!coupon || problem) {
      return NextResponse.json({ isValid: false, message: problem ?? "Invalid or expired coupon code" });
    }

    // Same calculation the order routes use, so the preview always matches the charge.
    const discountAmount = computeCouponDiscount(coupon, subtotal);

    return NextResponse.json({
      isValid: true,
      discountAmount,
      code: coupon.code,
      message: "Coupon applied successfully!"
    });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
