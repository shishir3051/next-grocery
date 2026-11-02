import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/authGuard";
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { title, content, excerpt, category, image, imageData, readTime } = body;

    if (!title || !content || !excerpt || !category || !readTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple slugification
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newArticle = await News.create({
      title,
      slug,
      content,
      excerpt,
      category,
      image: image || 'uploaded',
      imageData,
      readTime,
      isPublished: true
    });

    return NextResponse.json({ 
      message: 'Article created successfully', 
      article: newArticle 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
