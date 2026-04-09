import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { HeroSlide } from "@/models/HeroSlide";

export async function GET() {
  try {
    await dbConnect();
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    console.error("Fetch hero slides error:", error);
    return NextResponse.json({ error: "Failed to fetch hero content" }, { status: 500 });
  }
}
