"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Image as ImageIcon, 
  ArrowRight,
  Loader2,
  Check,
  Eye,
  Settings,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";

interface HeroSlide {
  _id?: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  gradient: string;
  accentColor: string;
  decorColor: string;
  emoji: string;
  tag: string;
  tagColor: string;
  isActive: boolean;
  order: number;
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<HeroSlide>({
    title: "",
    highlight: "",
    subtitle: "",
    ctaLabel: "Shop Now",
    ctaLink: "all",
    image: "",
    gradient: "from-teal-600 via-emerald-600 to-teal-800",
    accentColor: "text-emerald-300",
    decorColor: "bg-emerald-400/20",
    emoji: "🥦",
    tag: "",
    tagColor: "bg-emerald-500/30 text-emerald-100",
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/hero");
      const data = await res.json();
      if (data.success) setSlides(data.slides);
    } catch (e) {
      toast.error("Failed to load slides");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData(slide);
    } else {
      setEditingSlide(null);
      setFormData({
        title: "",
        highlight: "",
        subtitle: "",
        ctaLabel: "Shop Now",
        ctaLink: "all",
        image: "",
        gradient: "from-teal-600 via-emerald-600 to-teal-800",
        accentColor: "text-emerald-300",
        decorColor: "bg-emerald-400/20",
        emoji: "🥦",
        tag: "",
        tagColor: "bg-emerald-500/30 text-emerald-100",
        isActive: true,
        order: slides.length
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSlide ? "PUT" : "POST";
    const body = editingSlide ? { id: editingSlide._id, ...formData } : formData;

    try {
      const res = await fetch("/api/admin/hero", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Slide ${editingSlide ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        fetchSlides();
      }
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
      const res = await fetch(`/api/admin/hero?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Slide deleted");
        fetchSlides();
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slide._id, isActive: !slide.isActive })
      });
      if (res.ok) fetchSlides();
    } catch (e) {
      toast.error("Toggle failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hero Banners</h2>
          <p className="text-sm font-medium text-slate-500">Manage the sliding banners on your home page.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus size={20} /> Add New Slide
        </button>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {slides.map((slide) => (
            <motion.div 
              key={slide._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-3xl border ${slide.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'} overflow-hidden shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Preview Thumbnail */}
                <div className={`w-full md:w-64 h-40 relative flex-shrink-0 bg-gradient-to-br ${slide.gradient} overflow-hidden`}>
                   {slide.image && (
                     <Image src={slide.image} alt={slide.title} fill className="object-cover mix-blend-overlay opacity-60" />
                   )}
                   <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{slide.tag}</p>
                      <h4 className="text-sm font-black leading-tight truncate">{slide.title}</h4>
                   </div>
                   <div className="absolute top-3 left-3 px-2 py-1 bg-black/30 backdrop-blur-md rounded text-[10px] font-black text-white uppercase tracking-tighter">
                     Order: {slide.order}
                   </div>
                </div>

                {/* Info & Actions */}
                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-slate-800 truncate">{slide.title}</h3>
                      {!slide.isActive && (
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded">Draft</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{slide.subtitle}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <ArrowRight size={14} className="text-teal-500" />
                        CTA: <span className="text-slate-600">{slide.ctaLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 border-l border-slate-100 pl-3">
                        <ImageIcon size={14} className="text-blue-500" />
                        {slide.image ? 'Custom Image' : 'Gradient Only'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleActive(slide)}
                      className={`p-3 rounded-xl transition-all ${slide.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      title={slide.isActive ? "Deactivate" : "Activate"}
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(slide)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button 
                      onClick={() => slide._id && handleDelete(slide._id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {slides.length === 0 && (
            <div className="py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                 <ImageIcon className="text-slate-300 w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-slate-800">No slides yet</h3>
               <p className="text-sm text-slate-500 mb-6">Create your first dynamic banner for the homepage.</p>
               <button 
                onClick={() => handleOpenModal()}
                className="px-6 py-2.5 bg-teal-600 text-white font-black rounded-xl"
               >
                 Create Slide
               </button>
            </div>
          )}
        </div>
      )}

      {/* Slide Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{editingSlide ? "Edit Slide" : "Create New Slide"}</h3>
                  <p className="text-xs font-black text-teal-600 uppercase tracking-widest mt-1">Hero Banner Configuration</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left Column: Content */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Main Title</label>
                      <input 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Fresh Groceries"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Highlight Text</label>
                      <input 
                        value={formData.highlight}
                        onChange={(e) => setFormData({...formData, highlight: e.target.value})}
                        placeholder="e.g. delivered in 60 mins"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Subtitle / Description</label>
                      <textarea 
                        required
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        rows={3}
                        placeholder="Provide some catchy details..."
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Button Label</label>
                        <input 
                          value={formData.ctaLabel}
                          onChange={(e) => setFormData({...formData, ctaLabel: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Link (Slug or URL)</label>
                        <input 
                          value={formData.ctaLink}
                          onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Badge Text</label>
                        <input 
                          value={formData.tag}
                          onChange={(e) => setFormData({...formData, tag: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Emoji Icon</label>
                        <input 
                          value={formData.emoji}
                          onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Styling & Media */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                        Custom Image 
                        <span className="text-[9px] font-normal lowercase tracking-normal opacity-60">Leave empty to use gradient only</span>
                      </label>
                      <div className="relative group/img h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center">
                        {formData.image ? (
                          <>
                            <Image src={formData.image} alt="Preview" fill className="object-cover" />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, image: ""})}
                              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover/img:opacity-100 transition-all shadow-lg"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-6">
                            <ImageIcon className="text-slate-300 w-10 h-10 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-bold">Drop image or click to upload</p>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageFile}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Background Gradient (Tailwind Classes)</label>
                      <input 
                        value={formData.gradient}
                        onChange={(e) => setFormData({...formData, gradient: e.target.value})}
                        placeholder="e.g. from-teal-600 via-emerald-600 to-teal-800"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Order</label>
                        <input 
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Visibility</label>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                            formData.isActive 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          {formData.isActive ? <Check size={16} /> : <X size={16} />}
                          {formData.isActive ? "Visible" : "Hidden"}
                        </button>
                      </div>
                    </div>

                    {/* Quick Preview */}
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Live Appearance Preview</label>
                      <div className={`w-full aspect-[2/1] bg-gradient-to-br ${formData.gradient} rounded-2xl relative overflow-hidden flex flex-col justify-center p-6 text-white`}>
                        {formData.image && <Image src={formData.image} alt="Preview" fill className="object-cover mix-blend-overlay opacity-60" />}
                        <div className="relative z-10">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm mb-1 inline-block">{formData.tag || 'Sample Tag'}</span>
                          <h5 className="text-lg font-black leading-tight mb-1">{formData.title || 'Dynamic Hero'}</h5>
                          <p className="text-[10px] opacity-80 line-clamp-2">{formData.subtitle || 'Your dynamic content will appear here.'}</p>
                          <div className="mt-3 flex gap-2">
                             <div className="h-6 w-16 bg-white rounded flex items-center justify-center text-[8px] font-black text-slate-900">{formData.ctaLabel}</div>
                             <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{formData.emoji}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-3 pt-6 border-t border-slate-100">
                   <button 
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                   >
                     <Save size={20} />
                     {editingSlide ? "Update Slide Configuration" : "Launch New Hero Slide"}
                   </button>
                   <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                   >
                     Cancel
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
