import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/lib/actions';
import { serverError } from '@/lib/http';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')?.slice(0, 100);
    const search = request.nextUrl.searchParams.get('search');

    const products = search ? await searchProducts(search) : await getProducts(category || undefined);
    return NextResponse.json({ products });
  } catch (error) {
    return serverError(error, 'Products fetch error');
  }
}
