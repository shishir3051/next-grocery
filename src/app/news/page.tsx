"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

/**
 * Article cover image with a branded placeholder.
 * Shown when the article has no image or the image fails to load,
 * so the card never shows broken-image alt text.
 */
function NewsCover({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-50 text-brand-600">
        <Newspaper size={36} aria-hidden="true" />
        <span className="text-xs font-semibold text-brand-700">FreshBasket News</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images can be base64 data or any remote host
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/news', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch news", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">News & tips</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Latest news</h1>
          <p className="mt-3 text-base text-slate-600">
            Stay updated with FreshBasket&apos;s latest announcements, health tips and grocery insights.
          </p>
        </header>

        <div className="mt-8 sm:mt-10">
          {loading ? (
            // Skeleton cards keep the layout stable while articles load
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading articles">
              {[0, 1, 2].map(i => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="skeleton h-48 rounded-none!" />
                  <div className="space-y-3 p-5">
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-5 w-5/6" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((news, i) => (
                <motion.article
                  key={news._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.06 }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link href={`/news/${news._id}`} tabIndex={-1} aria-hidden="true" className="relative block h-48 overflow-hidden">
                    <NewsCover src={news.imageData || news.image} alt="" />
                    {news.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
                        {news.category}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} aria-hidden="true" />
                        {new Date(news.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      {news.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} aria-hidden="true" />
                          {news.readTime}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-700">
                      <Link href={`/news/${news._id}`}>{news.title}</Link>
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {news.excerpt}
                    </p>

                    <div className="mt-auto pt-4">
                      <Link
                        href={`/news/${news._id}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Read full story <ArrowRight size={16} aria-hidden="true" />
                        <span className="sr-only">: {news.title}</span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                <Newspaper className="text-slate-400" size={28} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No news articles yet</h2>
              <p className="mt-1 text-sm text-slate-500">Check back soon for stories, tips and announcements.</p>
            </div>
          )}
        </div>

        {/* Newsletter (visual only, no subscription backend yet) */}
        <section className="mt-12 rounded-2xl bg-brand-700 px-6 py-10 text-center text-white sm:mt-16 sm:px-12 sm:py-12">
          <h2 className="text-xl font-bold sm:text-2xl">Subscribe to our newsletter</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-50 sm:text-base">
            Get early access to weekly deals and the freshest news delivered to your inbox.
          </p>
          <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              className="h-11 w-full rounded-xl border border-white/30 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <Button variant="secondary" className="flex-shrink-0 border-white text-brand-700 focus-visible:outline-white">
              Join
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
