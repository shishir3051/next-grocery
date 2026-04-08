"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      {/* Hero */}
      <div className="bg-white border-b border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Latest <span className="text-teal-600">News</span></h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            Stay updated with FreshBasket's latest announcements, health tips, and grocery insights.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
            <p className="text-slate-400 font-bold">Loading the latest stories...</p>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((news, i) => (
              <motion.article 
                key={news._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all group"
              >
                <div className="relative h-56 overflow-hidden">
                   <img 
                    src={news.imageData || news.image || "https://placehold.co/800x600/f1f5f9/94a3b8?text=Waiting+for+Image..."} 
                    alt={news.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-teal-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {news.category}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(news.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {news.readTime}
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                    {news.title}
                  </h2>
                  
                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-3">
                    {news.excerpt}
                  </p>

                  <div className="pt-4 border-t border-slate-50">
                    <Link href={`/news/${news._id}`} className="inline-flex items-center gap-2 text-sm font-black text-teal-600 hover:gap-3 transition-all">
                      Read Full Story <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
             <p className="text-slate-400 font-bold">No news articles found.</p>
          </div>
        )}
      </div>

      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="bg-teal-600 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl md:text-4xl font-black italic">Subscribe to our newsletter</h2>
            <p className="text-teal-50 opacity-90 font-medium max-w-md mx-auto">Get early access to weekly deals and the freshest news delivered to your inbox.</p>
            <div className="max-w-md mx-auto relative flex items-center">
               <input 
                type="email" 
                placeholder="Enter your email address"
                className="w-full px-8 py-5 bg-white/10 border border-teal-400/50 rounded-2xl text-white placeholder:text-teal-100 outline-none focus:ring-2 focus:ring-white transition-all backdrop-blur-sm"
               />
               <button className="absolute right-2 px-6 py-3 bg-white text-teal-600 font-black rounded-xl hover:bg-slate-50 transition-all shadow-lg text-sm">
                 Join
               </button>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
      </div>
    </div>
  );
}
