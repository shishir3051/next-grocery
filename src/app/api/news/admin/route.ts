import { NextRequest, NextResponse } from 'next/server';
import { News } from '@/models/News';
import { requireRoleForWrite } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, readJsonObject, serverError } from "@/lib/http";
import { parseNews } from "@/lib/newsInput";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const parsed = parseNews(body, false);
    if ("error" in parsed) return badRequest(parsed.error);

    const newArticle = await News.create({ isPublished: true, ...parsed.value });

    return NextResponse.json({
      message: 'Article created successfully',
      article: newArticle
    }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A story with this title already exists");
    return serverError(error, "News create error");
  }
}
