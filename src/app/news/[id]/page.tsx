"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, ArrowLeft, ArrowRight, User, Share2, Tag, FileQuestion, Newspaper } from "lucide-react";
import { IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";

const SHARE_TARGETS = [
  { label: "Share on Facebook", Icon: IconBrandFacebook },
  { label: "Share on Twitter", Icon: IconBrandTwitter },
  { label: "Share on LinkedIn", Icon: IconBrandLinkedin },
  { label: "More sharing options", Icon: Share2 },
];

const TOPICS = ['Nutrition', 'Health', 'Recipes', 'EcoFriendly', 'Farming'];

/** Cover image with a branded placeholder when missing or broken. */
function ArticleCover({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-50 text-brand-600">
        <Newspaper size={48} aria-hidden="true" />
        <span className="text-sm font-semibold text-brand-700">FreshBasket News</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images can be base64 data or any remote host
    <img src={src} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" />
  );
}

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/news/${params.id}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setArticle(data.article);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch article", err);
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-busy="true" aria-label="Loading article">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton mt-6 h-8 w-3/4 max-w-2xl" />
          <div className="skeleton mt-3 h-4 w-1/3" />
          <div className="skeleton mt-8 aspect-[16/9] w-full rounded-2xl! sm:aspect-[21/9]" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-14">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
            <FileQuestion className="text-slate-400" size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Story not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This article might have been moved or archived. Explore our other fresh news.
          </p>
          <Button href="/news" className="mt-6">
            <ArrowLeft size={18} aria-hidden="true" /> Back to news
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/news"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All news
        </Link>

        {/* Article header */}
        <header className="mt-6 max-w-3xl">
          {article.category && (
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {article.category}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User size={16} aria-hidden="true" />
              {article.author || 'FreshBasket Team'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={16} aria-hidden="true" />
              {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {article.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden="true" />
                {article.readTime}
              </span>
            )}
          </div>
        </header>

        {/* Cover image */}
        <div className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:aspect-[21/9]">
          <ArticleCover src={article.imageData || article.image} alt={article.title} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Article body */}
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:col-span-2">
            {article.excerpt && (
              <p className="border-l-4 border-brand-500 pl-4 text-lg font-medium leading-relaxed text-slate-800">
                {article.excerpt}
              </p>
            )}

            {/* Rendered as text (not HTML) so article content can never inject scripts;
                whitespace-pre-line keeps the author's line breaks. */}
            <div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">
              {article.content}
            </div>

            {/* Share (buttons are placeholders until sharing is wired up) */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-semibold text-slate-700">Share this story</h2>
              <div className="flex items-center gap-2">
                {SHARE_TARGETS.map(({ label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-[calc(var(--navbar-height)+1.5rem)]">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Tag className="text-brand-600" size={18} aria-hidden="true" /> Topics
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {TOPICS.map(topic => (
                    <li key={topic} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      #{topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
                <p className="text-sm font-semibold text-brand-900">Want more fresh insights?</p>
                <Link
                  href="/"
                  className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Shop our collection <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
