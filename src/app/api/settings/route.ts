import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Settings } from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Return only public, non-sensitive settings with cache-busting headers
    return NextResponse.json({
      settings: {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        deliveryFee: settings.deliveryFee,
        minFreeDelivery: settings.minFreeDelivery,
        maintenanceMode: settings.maintenanceMode,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("Public settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
