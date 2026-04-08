"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, User, Share2, Tag } from "lucide-react";
import { IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
           <p className="text-slate-500 font-bold">Unfolding the story...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-6 max-w-md mx-4">
          <div className="text-6xl">🔍</div>
          <h2 className="text-3xl font-black text-slate-800">Story Not Found</h2>
          <p className="text-slate-500 font-medium">This article might have been moved or archived. Explore our other fresh news!</p>
          <Link href="/news" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg hover:bg-teal-700 transition-all">
            <ArrowLeft size={18} /> Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Article Header & Image */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          src={article.imageData || article.image || "https://placehold.co/1200x800/f1f5f9/94a3b8?text=Image+Needed..."} 
          alt={article.title} 
          className="absolute inset-0 w-full h-full object-cover shadow-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 pb-20 md:p-12 md:pb-28">
          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
               <span className="px-4 py-1.5 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  {article.category}
               </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl"
            >
              {article.title}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 text-white text-sm font-black drop-shadow-lg"
            >
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <User size={16} className="text-teal-400" />
                {article.author || 'FreshBasket Team'}
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <Calendar size={16} className="text-teal-400" />
                {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <Clock size={16} className="text-teal-400" />
                {article.readTime}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 mt-[-4rem] relative z-10 flex flex-col lg:flex-row gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:w-2/3 bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-900/10 border border-slate-100"
        >
          {/* Excerpt */}
          <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed italic mb-10 border-l-8 border-teal-500 pl-6 bg-slate-50 py-4 rounded-r-2xl">
            {article.excerpt}
          </p>
          
          {/* Main Content */}
          <div 
            className="prose prose-lg prose-teal max-w-none text-slate-600 font-medium leading-[1.8] space-y-6"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
          />

          {/* Social Share */}
          <div className="mt-16 pt-10 border-t border-slate-50 flex items-center justify-between">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs">Share this story</h4>
            <div className="flex items-center gap-3">
               {[IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin, Share2].map((Icon, i) => (
                 <button key={i} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center">
                   <Icon size={18} />
                 </button>
               ))}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="lg:w-1/3 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-24">
             <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Tag className="text-teal-500" size={20} /> Fresh Categories
             </h3>
             <div className="flex flex-wrap gap-2">
                {['Nutrition', 'Health', 'Recipes', 'EcoFriendly', 'Farming'].map(cat => (
                  <span key={cat} className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl hover:bg-teal-50 hover:text-teal-600 cursor-pointer transition-all">
                    #{cat}
                  </span>
                ))}
             </div>
             
             <div className="mt-10 p-6 bg-teal-50 rounded-[2rem] border border-teal-100 space-y-4">
                <p className="text-teal-800 font-bold text-sm">Want more fresh insights?</p>
                <Link href="/" className="inline-flex items-center gap-2 text-teal-600 font-black text-xs hover:gap-3 transition-all">
                   Shop Our Collection <ArrowLeft className="rotate-180" size={14} />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
