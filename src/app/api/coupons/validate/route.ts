import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { computeCouponDiscount } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, subtotal } = await request.json();

    if (typeof code !== 'string' || !code || typeof subtotal !== 'number') {
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
