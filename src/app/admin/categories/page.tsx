"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2,
  Check,
  X,
  ChevronRight,
  Save as SaveIcon,
  LayoutDashboard
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    parentId: "",
    icon: ""
  });

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory ? { ...formData, id: editingCategory._id } : formData;
      
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", parentId: "", icon: "" });
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setModalConfig({
        isOpen: true,
        title: "Delete Category",
        message: "Are you sure you want to delete this category? This will fail if there are products or subcategories linked to it.",
        type: 'danger',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
              fetchCategories();
            } else {
              alert(data.error);
            }
          } catch (error) {
            console.error("Delete error:", error);
          }
        }
    });
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      parentId: cat.parentId || "",
      icon: cat.icon || ""
    });
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Tree logic: Find children of a category
  const findChildren = (parentId: string | null) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Category Dashboard</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Organize your products with ease.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => { setEditingCategory(null); setFormData({name:"", parentId:"", icon:""}); setIsModalOpen(true); }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 whitespace-nowrap"
            >
              <Plus size={16} /> <span className="md:inline">New Category</span>
            </button>
        </div>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Icon</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Category Name</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Slug</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Level</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* We could render as a nested tree if we want, but flat with level indicator is safer for search */}
                {paginatedCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-sm border border-slate-200">
                          {cat.icon || '📦'}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          {cat.level > 0 && <ChevronRight size={14} className="text-slate-300 ml-2" />}
                          <span className={`${cat.level === 0 ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
                            {cat.name}
                          </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] font-mono bg-slate-50 px-2 py-1 rounded text-slate-400">
                           {cat.slug}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${cat.level === 0 ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                           {cat.level === 0 ? 'Parent' : `Level ${cat.level}`}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(cat)}
                          className="p-2 hover:bg-teal-50 hover:text-teal-600 text-slate-400 rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat._id)}
                          className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {Math.min(filteredCategories.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCategories.length, currentPage * itemsPerPage)} of {filteredCategories.length} categories
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <X className="w-4 h-4 rotate-45" /> {/* Using X rotated as a chevron shortcut or just use Chevron icon */}
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <LayoutDashboard size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">{editingCategory ? "Edit Category" : "Add New Category"}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Organic Produce" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Parent Category</label>
                  <select 
                    value={formData.parentId} 
                    onChange={(e) => setFormData({...formData, parentId: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none cursor-pointer"
                  >
                    <option value="">No Parent (New Top Level)</option>
                    {parentCategories.map((pc) => (
                        <option key={pc._id} value={pc._id} disabled={editingCategory?._id === pc._id}>
                            {pc.name}
                        </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 ml-1">Select a parent to make this a subcategory.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Icon (Emoji)</label>
                  <input type="text" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} placeholder="🥗" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" />
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all">Cancel</button>
                  <button type="submit" disabled={isLoading} className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <SaveIcon size={20} />}
                    {editingCategory ? "Save Changes" : "Create Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({...modalConfig, isOpen: false})}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.type === 'danger' ? "Delete Category" : "Confirm"}
      />
    </div>
  );
}
