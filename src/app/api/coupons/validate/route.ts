import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { computeCouponDiscount } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rateLimit";
import { readJsonObject, tooManyRequests } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Stops guessing coupon codes by brute force.
    const limit = await checkRateLimit(`coupon-validate:${session.user.id}`, 20, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "Too many coupon attempts. Please wait a few minutes.");

    const { code, subtotal } = (await readJsonObject(request)) ?? {};

    if (typeof code !== 'string' || !code || code.length > 40 || typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await dbConnect();

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return NextResponse.json({ isValid: false, message: "Invalid or expired coupon code" });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json({ 
        isValid: false, 
        message: `Min order for this coupon is ৳${coupon.minOrderAmount}` 
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ isValid: false, message: "Coupon usage limit reached" });
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
