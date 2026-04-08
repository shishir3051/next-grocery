"use client";

import { useState } from "react";
import { 
  Save, 
  X, 
  Image as ImageIcon, 
  Type, 
  FileText, 
  Tag, 
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import toast from "react-hot-toast";

interface NewsFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function NewsForm({ initialData, isEditing = false }: NewsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "Company News",
    readTime: initialData?.readTime || "5 min read",
    image: initialData?.image || null,
    imageData: initialData?.imageData || "", 
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    isPublished: initialData?.isPublished ?? true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit Check
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large! Please keep it under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ 
        ...formData, 
        imageData: reader.result as string,
        image: null // Clear old link when new desktop photo is picked
      });
      toast.success("New image selected!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageData && !initialData?.image) {
      toast.error("Please upload an image for the story");
      return;
    }
    setLoading(true);

    try {
      const url = isEditing 
        ? `/api/news/admin/${initialData._id}` 
        : "/api/news/admin";
      
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(isEditing ? "Story updated!" : "Story created!");
        router.push("/admin/news");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to save story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Editor Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Type size={14} className="text-teal-500" /> Story Title
              </label>
              <input 
                required
                type="text" 
                placeholder="Enter a catchy title..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-lg"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <FileText size={14} className="text-teal-500" /> Excerpt
              </label>
              <textarea 
                required
                rows={3}
                placeholder="A short summary to hook your readers..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-slate-600 resize-none"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <FileText size={14} className="text-teal-500" /> Full Story Content
              </label>
              <textarea 
                required
                rows={12}
                placeholder="Write your story here... (Plain text, use line breaks for paragraphs)"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-slate-600"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
               Settings
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-slate-700"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Company News</option>
                <option>Healthy Living</option>
                <option>Tips & Tricks</option>
                <option>Organic Farming</option>
                <option>Recipes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Read Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="e.g. 5 min read"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-slate-700 text-sm"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Article Image</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-48 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4"
              >
                {(formData.imageData || initialData?.image) ? (
                  <img 
                    src={formData.imageData || initialData?.image} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-400 group-hover:text-teal-600">Select Story Photo</p>
                    <p className="text-[10px] text-slate-300">Max size: 5MB</p>
                  </div>
                )}
                
                {/* Overlay for change */}
                {(formData.imageData || initialData?.image) && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <p className="text-white text-xs font-black flex items-center gap-2">
                       <ImageIcon size={16} /> Change Photo
                     </p>
                  </div>
                )}
              </div>

              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="pt-4 border-t border-slate-50">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.isPublished ? 'bg-teal-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPublished ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Publish Story</span>
               </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-900/10 hover:bg-teal-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isEditing ? "Update Story" : "Publish Now"}
            </button>
            <button 
              type="button"
              onClick={() => router.push("/admin/news")}
              className="w-full bg-white text-slate-500 py-4 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
