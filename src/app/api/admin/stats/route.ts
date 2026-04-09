import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Date ranges for trend calculation
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalOrders, 
      totalProducts, 
      totalUsers, 
      latestOrders, 
      lowStockProducts,
      currentPeriodSales,
      prevPeriodSales,
      currentPeriodOrders,
      prevPeriodOrders,
      dailySalesData
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Product.find({ stock: { $lt: 10 } }).limit(5).sort({ stock: 1 }),
      
      // Current 7 days sales
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      // Previous 7 days sales
      Order.aggregate([
        { $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      // Order counts for trends
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      
      // Daily sales for chart
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalSalesAllTime = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);

    // Calculate trends
    const calculateTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? "+100%" : "0%";
      const diff = ((current - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    };

    const salesTrend = calculateTrend(currentPeriodSales[0]?.total || 0, prevPeriodSales[0]?.total || 0);
    const ordersTrend = calculateTrend(currentPeriodOrders, prevPeriodOrders);

    // Map daily sales to Recharts format and fill gaps
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      const dayData = dailySalesData.find(item => item._id === dateStr);
      salesHistory.push({
        name: dayName,
        sales: dayData ? dayData.sales : 0,
        fullDate: dateStr
      });
    }

    return NextResponse.json({
      metrics: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalSales: totalSalesAllTime[0]?.totalSales || 0,
        lowStockCount: lowStockProducts.length,
        trends: {
            sales: salesTrend,
            orders: ordersTrend,
            users: "+5.2%", // Placeholder for user growth
            inventory: "Healthy"
        }
      },
      salesHistory,
      latestOrders,
      lowStockProducts
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
