import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';
import { requireAdmin } from '@/lib/authGuard';
import { notFound, serverError } from '@/lib/http';
import { isObjectId } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return notFound('Article not found');

    await dbConnect();
    const article = await News.findById(id).lean<{ isPublished?: boolean }>();
    // Drafts are visible to admins only (the editor loads them through this route).
    if (!article || (article.isPublished === false && !(await requireAdmin()))) {
      return notFound('Article not found');
    }
    return NextResponse.json({ article });
  } catch (error) {
    return serverError(error, 'News fetch error');
  }
}
