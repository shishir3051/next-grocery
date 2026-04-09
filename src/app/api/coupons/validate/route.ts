import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, subtotal } = await request.json();

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await dbConnect();

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
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

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

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
