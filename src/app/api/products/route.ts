import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/lib/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products;
    if (search) {
      products = await searchProducts(search);
    } else {
      products = await getProducts(category || undefined);
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
