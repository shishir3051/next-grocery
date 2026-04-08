"use client";

import { Newspaper, ChevronLeft } from "lucide-react";
import Link from "next/link";
import NewsForm from "@/components/admin/NewsForm";

export default function CreateNewsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/admin/news" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold transition-all text-sm mb-2"
          >
            <ChevronLeft size={16} /> Back to News
          </Link>
          <h1 className="text-3xl font-black text-slate-800">Create New <span className="text-teal-600">Story</span></h1>
          <p className="text-slate-500 font-medium">Draft a new article for your customers</p>
        </div>
      </div>

      <NewsForm />
    </div>
  );
}
