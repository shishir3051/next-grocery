import { NextRequest, NextResponse } from 'next/server';
import { News } from '@/models/News';
import { requireRole } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId } from "@/lib/validation";
import { parseNews } from "@/lib/newsInput";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) return notFound('Article not found');

    const deletedArticle = await News.findByIdAndDelete(id);
    if (!deletedArticle) return notFound('Article not found');

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    return serverError(error, "News delete error");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) return notFound('Article not found');

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const parsed = parseNews(body, true);
    if ("error" in parsed) return badRequest(parsed.error);

    const updatedArticle = await News.findByIdAndUpdate(id, { $set: parsed.value }, { new: true, runValidators: true });
    if (!updatedArticle) return notFound('Article not found');

    return NextResponse.json({ message: 'Article updated successfully', article: updatedArticle });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A story with this title already exists");
    return serverError(error, "News update error");
  }
}
