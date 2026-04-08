"use client";

import { useState, useEffect } from "react";
import { 
  Newspaper, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
      toast.error("Error deleting article");
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">News Management</h1>
          <p className="text-slate-500 font-medium">Create and manage your store's latest stories</p>
        </div>
        <Link 
          href="/admin/news/new"
          className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/10"
        >
          <Newspaper size={18} />
          Create New Story
        </Link>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Stories</p>
          <p className="text-3xl font-black text-slate-800">{articles.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Published</p>
          <p className="text-3xl font-black text-emerald-600">{articles.filter(a => a.isPublished).length}</p>
        </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Categories</p>
          <p className="text-3xl font-black text-teal-600">{new Set(articles.map(a => a.category)).size}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by title or category..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            <p className="text-slate-400 font-bold">Fetching your news center...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Story Details</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredArticles.map((article) => (
                  <tr key={article._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          <img 
                            src={article.imageData || article.image || "https://placehold.co/400x400/f1f5f9/94a3b8?text=No+Image"} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{article.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{article.readTime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-full tracking-wider">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${article.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-bold ${article.isPublished ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {article.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                       <Link 
                        href={`/admin/news/edit/${article._id}`}
                        className="inline-flex p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        title="Edit Story"
                       >
                         <Pencil size={18} />
                       </Link>
                       <button 
                        onClick={() => handleDelete(article._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Story"
                       >
                         <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-slate-300" size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-800 font-black">No Stories Found</p>
              <p className="text-slate-400 text-sm font-medium">Try searching for something else or create your first story.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
