"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import NewsForm from "@/components/admin/NewsForm";

export default function CreateNewsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* The shell's top bar already shows "News", so this is a section title */}
      <div className="space-y-1">
        <Link
          href="/admin/news"
          className="-ml-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-700"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Back to news
        </Link>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Create story</h2>
        <p className="text-sm text-slate-500">Draft a new article for your customers.</p>
      </div>

      <NewsForm />
    </div>
  );
}
