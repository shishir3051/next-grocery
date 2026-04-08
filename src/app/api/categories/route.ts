import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/actions';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
