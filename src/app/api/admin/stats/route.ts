import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [totalOrders, totalProducts, totalUsers, latestOrders, lowStockProducts] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Product.find({ stock: { $lt: 10 } }).limit(5).sort({ stock: 1 })
    ]);

    const salesStats = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);

    return NextResponse.json({
      metrics: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalSales: salesStats[0]?.totalSales || 0,
        lowStockCount: lowStockProducts.length
      },
      latestOrders,
      lowStockProducts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
