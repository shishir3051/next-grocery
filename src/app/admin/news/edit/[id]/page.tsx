"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NewsForm from "@/components/admin/NewsForm";

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-400 font-bold">Loading story editor...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-6 max-w-md mx-4 border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
             <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Story Not Found</h2>
          <p className="text-slate-500 font-medium">We couldn't find the article you're trying to edit.</p>
          <Link href="/admin/news" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg hover:bg-teal-700 transition-all">
            <ChevronLeft size={18} /> Back to News
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-slate-800">Edit <span className="text-teal-600">Story</span></h1>
          <p className="text-slate-500 font-medium">Update the details of your article</p>
        </div>
      </div>

      <NewsForm initialData={article} isEditing={true} />
    </div>
  );
}
