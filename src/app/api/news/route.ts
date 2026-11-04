import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';
import { serverError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const articles = await News.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ articles });
  } catch (error) {
    return serverError(error, 'News list error');
  }
}
