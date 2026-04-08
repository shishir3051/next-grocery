import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    // SSLCommerz sends data in form-data/urlencoded format
    const formData = await request.formData();
    const tran_id = formData.get('tran_id');
    const ssl_status = formData.get('status');

    await dbConnect();

    if (status === 'success' && ssl_status === 'VALID') {
      // 1. Fetch the order to get items
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'paid') {
        // 2. Decrement Stock for each item
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          });
        }

        // 3. Update order status to paid
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.status = 'processing';
        await order.save();
      }
      
      // Redirect to a success page (GET)
      return NextResponse.redirect(new URL(`/orders?session=success`, request.nextUrl.origin), 303);
    } 
    
    // For fail or cancel, redirect back to checkout with error
    return NextResponse.redirect(new URL(`/checkout?status=${status}`, request.nextUrl.origin), 303);

  } catch (error) {
    console.error("SSL Status Error:", error);
    return NextResponse.redirect(new URL(`/checkout?status=error`, request.nextUrl.origin), 303);
  }
}
