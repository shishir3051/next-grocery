import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order'; // Maybe use orders instead of checking cities? 
// No, cities is usually based on delivery zones, but we can hardcode 10+ or calculate unique areas.

export const revalidate = 3600; // Cache for 1 hour for performance

export async function GET() {
  try {
    await dbConnect();
    
    const [userCount, productCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments()
    ]);
    
    return NextResponse.json({
      customers: userCount,
      products: productCount,
      cities: 6 // Currently we have 6 hardcoded districts in location modal: Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Cumilla
    });
  } catch (error) {
    console.error("Public stats error", error);
    return NextResponse.json({ customers: 0, products: 0, cities: 0 }, { status: 500 });
  }
}
