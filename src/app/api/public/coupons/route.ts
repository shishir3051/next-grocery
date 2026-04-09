import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch active coupons that are not expired and have remaining uses
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    // Filter out coupons that have reached their usage limit in-memory or improve query
    const validCoupons = coupons.filter(coupon => {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return false;
        }
        return true;
    });

    return NextResponse.json({ 
        success: true, 
        coupons: validCoupons 
    });
  } catch (error) {
    console.error("Fetch public coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
