"use client";

import { useState, useEffect } from "react";
import {
  Newspaper,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  PANEL_CLASS,
  TH_CLASS,
  TD_CLASS,
  INPUT_CLASS,
  BADGE_CLASS,
  BADGE_TONES,
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS,
} from "@/components/admin/adminStyles";

/**
 * Square story thumbnail. Falls back to a branded placeholder when the article
 * has no image or the image URL fails to load (instead of a broken-image icon).
 */
function NewsThumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50">
        <Newspaper size={20} className="text-brand-600" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {/* Plain <img>: sources are base64 data URLs or arbitrary hosts that next/image is not configured for */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
       console.error("Failed to fetch articles", error);
       toast.error("Could not load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/news/admin/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Article deleted successfully");
        setArticles(articles.filter(a => a._id !== id));
      } else {
        toast.error("Failed to delete article");
      }
    } catch (error) {
      console.error("Delete article error:", error);
      toast.error("Error deleting article");
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Total stories", value: articles.length },
    { label: "Published", value: articles.filter(a => a.isPublished).length },
    { label: "Categories", value: new Set(articles.map(a => a.category)).size },
  ];

  return (
    <div className="space-y-6">
      {/* Header: the shell's top bar already shows "News", so this is a section title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">News &amp; stories</h2>
          <p className="text-sm text-slate-500">Create and manage your store&apos;s latest stories.</p>
        </div>
        <Button href="/admin/news/new" className="whitespace-nowrap">
          <Plus size={16} aria-hidden="true" /> New story
        </Button>
      </div>

      {/* Quick stats */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cn(PANEL_CLASS, "p-4 sm:p-5")}>
            <dt className="text-sm font-medium text-slate-600">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {/* Search */}
      <div className="relative">
        <label htmlFor="news-search" className="sr-only">Search stories</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          id="news-search"
          type="search"
          placeholder="Search by title or category"
          className={cn(INPUT_CLASS, "pl-10")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stories table */}
      <div className={cn(PANEL_CLASS, "overflow-hidden")}>
        {loading ? (
          <div className="flex h-64 items-center justify-center" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
            <span className="sr-only">Loading stories…</span>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th scope="col" className={TH_CLASS}>Story</th>
                  <th scope="col" className={TH_CLASS}>Category</th>
                  <th scope="col" className={TH_CLASS}>Date</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article._id} className="transition-colors hover:bg-slate-50">
                    <td className={TD_CLASS}>
                      <div className="flex items-center gap-3">
                        <NewsThumbnail src={article.imageData || article.image} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 line-clamp-1">{article.title}</p>
                          {article.readTime && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Clock size={12} aria-hidden="true" />
                              {article.readTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={TD_CLASS}>
                      <span className={cn(BADGE_CLASS, BADGE_TONES.brand, "whitespace-nowrap")}>
                        {article.category}
                      </span>
                    </td>
                    <td className={cn(TD_CLASS, "whitespace-nowrap text-slate-600")}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" aria-hidden="true" />
                        <time dateTime={article.createdAt}>
                          {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </time>
                      </span>
                    </td>
                    <td className={TD_CLASS}>
                      <span className={cn(BADGE_CLASS, article.isPublished ? BADGE_TONES.success : BADGE_TONES.neutral)}>
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", article.isPublished ? "bg-success-500" : "bg-slate-400")}
                          aria-hidden="true"
                        />
                        {article.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className={cn(TD_CLASS, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/news/edit/${article._id}`}
                          aria-label={`Edit "${article.title}"`}
                          title="Edit story"
                          className={cn(ICON_BUTTON_CLASS, "hover:bg-brand-50 hover:text-brand-700")}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(article._id)}
                          aria-label={`Delete "${article.title}"`}
                          title="Delete story"
                          className={ICON_BUTTON_DANGER_CLASS}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <Newspaper size={24} className="text-brand-600" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">
              {searchTerm ? "No matching stories" : "No stories yet"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {searchTerm
                ? `Nothing matches "${searchTerm}". Try a different title or category.`
                : "Write your first story to share news, tips and recipes with your customers."}
            </p>
            {!searchTerm && (
              <Button href="/admin/news/new" variant="secondary" className="mt-5">
                <Plus size={16} aria-hidden="true" /> New story
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
