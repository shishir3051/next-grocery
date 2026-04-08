import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();
  try {
    const articles = await News.find({ isPublished: true }).sort({ createdAt: -1 });
    return NextResponse.json({ articles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
