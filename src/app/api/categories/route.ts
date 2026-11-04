import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/actions';
import { serverError } from '@/lib/http';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return serverError(error, 'Categories fetch error');
  }
}
