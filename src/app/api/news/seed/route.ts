import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';
import { newsArticles } from '@/lib/seed';

export async function GET() {
  await dbConnect();
  try {
    // Clear existing news to prevent duplicates
    await News.deleteMany({});
    
    // Insert the articles
    await News.insertMany(newsArticles);
    
    return NextResponse.json({ 
      success: true, 
      message: `${newsArticles.length} news articles have been pushed to the database successfully!` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
