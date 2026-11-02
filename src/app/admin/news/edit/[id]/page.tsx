"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NewsForm from "@/components/admin/NewsForm";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { PANEL_CLASS } from "@/components/admin/adminStyles";

export default function EditNewsPage() {
  const params = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const id = (await params).id;
        const res = await fetch(`/api/news/${id}`);
        const data = await res.json();
        setArticle(data.article);
      } catch (error) {
        console.error("Failed to fetch article", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading story editor…</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className={cn(PANEL_CLASS, "w-full max-w-md p-6 sm:p-8 text-center")}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FileQuestion size={24} className="text-slate-500" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Story not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            We couldn&apos;t find the article you&apos;re trying to edit. It may have been deleted.
          </p>
          <Button href="/admin/news" variant="secondary" className="mt-6">
            <ChevronLeft size={16} aria-hidden="true" /> Back to news
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* The shell's top bar already shows "News", so this is a section title */}
      <div className="space-y-1">
        <Link
          href="/admin/news"
          className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-700"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Back to news
        </Link>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Edit story</h2>
        <p className="text-sm text-slate-500">Update the details of your article.</p>
      </div>

      <NewsForm initialData={article} isEditing={true} />
    </div>
  );
}
