import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Settings } from "@/models/Settings";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { items, totalAmount, shippingAddress, deliveryNote, couponCode } = await request.json();


    if (!items || !totalAmount || !shippingAddress) {
      return NextResponse.json({ error: "Missing order details" }, { status: 400 });
    }

    const tran_id = `SSLC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    await dbConnect();

    let calculatedSubTotal = 0;
    // 0. Verify stock availability and calculate true subtotal
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product?.name || 'an item'}. Available: ${product?.stock || 0}` 
        }, { status: 400 });
      }
      calculatedSubTotal += (product.discountPrice || product.price) * item.quantity;
    }

    // 1. Server-Side Coupon Re-validation
    let discountFromCoupon = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        isActive: true,
        expiryDate: { $gte: new Date() }
      });

      if (coupon && calculatedSubTotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discountFromCoupon = (calculatedSubTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discountFromCoupon = Math.min(discountFromCoupon, coupon.maxDiscount);
        } else {
          discountFromCoupon = coupon.discountValue;
        }
      }
    }

    const deliveryFee = calculatedSubTotal >= (settings?.minFreeDelivery || 500) ? 0 : (settings?.deliveryFee || 50);
    const calculatedTotal = calculatedSubTotal + deliveryFee - discountFromCoupon;

    // Create provisional order
    const order = await Order.create({
      user: (session.user as any).id,
      items,
      totalAmount: calculatedTotal,
      shippingAddress,
      status: 'pending',
      paymentProvider: 'sslcommerz',
      paymentProviderId: tran_id,
      paymentStatus: 'unpaid',
      deliveryNote,
      couponCode: discountFromCoupon > 0 ? couponCode.toUpperCase() : null,
      discountAmount: discountFromCoupon
    });

    // Construct form data as URLSearchParams
    const formData = new URLSearchParams();
    formData.append('store_id', process.env.SSLCOMMERZ_STORE_ID || '');
    formData.append('store_passwd', process.env.SSLCOMMERZ_STORE_PASSWORD || '');
    formData.append('total_amount', calculatedTotal.toString());
    formData.append('currency', 'BDT');
    formData.append('tran_id', tran_id);
    formData.append('success_url', `${baseUrl}/api/payments/ssl-status?status=success&orderId=${order._id}`);
    formData.append('fail_url', `${baseUrl}/api/payments/ssl-status?status=fail&orderId=${order._id}`);
    formData.append('cancel_url', `${baseUrl}/api/payments/ssl-status?status=cancel&orderId=${order._id}`);
    formData.append('ipn_url', `${baseUrl}/api/payments/ssl-status?status=ipn`);
    
    // Customer Info
    formData.append('cus_name', session.user.name || 'Customer');
    formData.append('cus_email', session.user.email || 'customer@example.com');
    formData.append('cus_add1', shippingAddress.street);
    formData.append('cus_city', shippingAddress.city);
    formData.append('cus_postcode', shippingAddress.zipCode);
    formData.append('cus_country', 'Bangladesh');
    formData.append('cus_phone', shippingAddress.phone);
    
    // Shipping Info
    formData.append('shipping_method', 'Courier');
    formData.append('num_of_item', items.length.toString());
    formData.append('product_name', 'Grocery Items');
    formData.append('product_category', 'Grocery');
    formData.append('product_profile', 'general');
    formData.append('ship_name', session.user.name || 'Customer');
    formData.append('ship_add1', shippingAddress.street);
    formData.append('ship_city', shippingAddress.city);
    formData.append('ship_state', shippingAddress.city);
    formData.append('ship_postcode', shippingAddress.zipCode);
    formData.append('ship_country', 'Bangladesh');

    const isLive = process.env.IS_LIVE === 'true';
    const sslUrl = isLive 
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    const gatewayResponse = await fetch(sslUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const apiResponse = await gatewayResponse.json();
    
    if (apiResponse?.status === 'SUCCESS' && apiResponse?.GatewayPageURL) {
      return NextResponse.json({ url: apiResponse.GatewayPageURL });
    } else {
      console.error("SSLCommerz API Error Response:", apiResponse);
      return NextResponse.json({ 
        error: "Failed to initialize payment gateway", 
        gatewayResponse: apiResponse 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("SSLCommerz Init Error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
  }
}
