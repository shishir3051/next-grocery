"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Save as SaveIcon
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  PANEL_CLASS,
  TH_CLASS,
  TD_CLASS,
  LABEL_CLASS,
  INPUT_CLASS,
  HELP_CLASS,
  PAGE_BUTTON_CLASS,
  BADGE_CLASS,
  BADGE_TONES,
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS
} from "@/components/admin/adminStyles";

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

  // Close the add/edit dialog with the Escape key (same effect as the close button)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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

  // Tree logic: Find children of a category
  const findChildren = (parentId: string | null) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const parentCategories = categories.filter(c => !c.parentId);

  // Lookup for "Subcategory of …" labels
  const categoriesById = new Map(categories.map(c => [String(c._id), c] as const));

  // Display order: every parent followed directly by its subcategories, so the
  // hierarchy reads top-down. Categories whose parent is missing go at the end.
  const treeOrderedCategories: typeof categories = [];
  const placedIds = new Set<string>();
  const addWithChildren = (cat: (typeof categories)[number]) => {
    if (placedIds.has(String(cat._id))) return; // guards against bad parent loops
    placedIds.add(String(cat._id));
    treeOrderedCategories.push(cat);
    findChildren(cat._id).forEach(addWithChildren);
  };
  parentCategories.forEach(addWithChildren);
  categories.forEach(c => { if (!placedIds.has(String(c._id))) treeOrderedCategories.push(c); });

  const filteredCategories = treeOrderedCategories.filter(c =>
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

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = filteredCategories.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastShown = Math.min(currentPage * itemsPerPage, filteredCategories.length);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", parentId: "", icon: "" });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & toolbar */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Category hierarchy</h2>
          <p className="text-sm text-slate-500">Group products into top-level categories and their subcategories.</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="category-search" className="sr-only">Search categories</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
              <input
                id="category-search"
                type="search"
                placeholder="Search categories"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(INPUT_CLASS, "pl-10")}
              />
            </div>
            <Button onClick={openCreateModal} className="whitespace-nowrap">
              <Plus size={16} aria-hidden="true" /> New category
            </Button>
        </div>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading categories…</span>
        </div>
      ) : (
        <div className={cn(PANEL_CLASS, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className={TH_CLASS}>Category</th>
                  <th scope="col" className={TH_CLASS}>Slug</th>
                  <th scope="col" className={TH_CLASS}>Level</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                      {searchTerm ? `No categories match "${searchTerm}".` : "No categories yet. Create your first category to get started."}
                    </td>
                  </tr>
                )}
                {paginatedCategories.map((cat) => {
                  const isSubcategory = cat.level > 0;
                  const parentName = cat.parentId ? categoriesById.get(String(cat.parentId))?.name : undefined;
                  const childCount = isSubcategory ? 0 : findChildren(cat._id).length;

                  return (
                    <tr key={cat._id} className={cn("transition-colors hover:bg-slate-50", isSubcategory && "bg-slate-50/60")}>
                      <td className={TD_CLASS}>
                        {/* Subcategories are indented with a connector arrow under their parent */}
                        <div className={cn("flex items-center gap-3", isSubcategory && "pl-6")}>
                          {isSubcategory && (
                            <CornerDownRight size={16} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
                          )}
                          <div
                            className={cn(
                              "flex flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white",
                              isSubcategory ? "h-9 w-9 text-lg" : "h-10 w-10 text-xl"
                            )}
                            aria-hidden="true"
                          >
                            {cat.icon || '📦'}
                          </div>
                          <div className="min-w-0">
                            <p className={cn("truncate", isSubcategory ? "font-medium text-slate-800" : "font-semibold text-slate-900")}>
                              {cat.name}
                            </p>
                            {isSubcategory ? (
                              parentName && <p className="text-xs text-slate-500">Subcategory of {parentName}</p>
                            ) : (
                              <p className="text-xs text-slate-500">
                                {childCount === 0 ? "No subcategories" : `${childCount} ${childCount === 1 ? "subcategory" : "subcategories"}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {cat.slug}
                        </code>
                      </td>
                      <td className={TD_CLASS}>
                        <span className={cn(BADGE_CLASS, isSubcategory ? BADGE_TONES.neutral : BADGE_TONES.brand)}>
                          {!isSubcategory ? "Top level" : cat.level === 1 ? "Subcategory" : `Level ${cat.level}`}
                        </span>
                      </td>
                      <td className={cn(TD_CLASS, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            aria-label={`Edit ${cat.name}`}
                            title="Edit"
                            className={ICON_BUTTON_CLASS}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat._id)}
                            aria-label={`Delete ${cat.name}`}
                            title="Delete"
                            className={ICON_BUTTON_DANGER_CLASS}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <nav
            aria-label="Categories pagination"
            className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{firstShown}</span>–<span className="font-semibold text-slate-900">{lastShown}</span> of <span className="font-semibold text-slate-900">{filteredCategories.length}</span> categories
            </p>
            {/* flex-wrap keeps many 40px page buttons from overflowing narrow screens */}
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={currentPage === i + 1 ? "page" : undefined}
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    currentPage === i + 1
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                aria-label="Next page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 id="category-modal-title" className="text-lg font-semibold text-slate-900">
                  {editingCategory ? "Edit category" : "Add new category"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                  className={ICON_BUTTON_CLASS}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-6 space-y-5">
                  <div>
                    <label htmlFor="category-name" className={LABEL_CLASS}>Category name</label>
                    <input
                      id="category-name"
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Organic produce"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="category-parent" className={LABEL_CLASS}>Parent category</label>
                    <select
                      id="category-parent"
                      value={formData.parentId}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      aria-describedby="category-parent-help"
                      className={cn(INPUT_CLASS, "cursor-pointer")}
                    >
                      <option value="">None (top-level category)</option>
                      {parentCategories.map((pc) => (
                          <option key={pc._id} value={pc._id} disabled={editingCategory?._id === pc._id}>
                              {pc.name}
                          </option>
                      ))}
                    </select>
                    <p id="category-parent-help" className={HELP_CLASS}>Pick a parent to make this a subcategory.</p>
                  </div>

                  <div>
                    <label htmlFor="category-icon" className={LABEL_CLASS}>Icon (emoji)</label>
                    <div className="flex items-center gap-3">
                      {/* Live preview of the emoji as it appears in the category list */}
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xl" aria-hidden="true">
                        {formData.icon || '📦'}
                      </div>
                      <input
                        id="category-icon"
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        placeholder="🥗"
                        aria-describedby="category-icon-help"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <p id="category-icon-help" className={HELP_CLASS}>Optional. Shown next to the category name; 📦 is used if left empty.</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 px-6 py-4">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={isLoading}>
                    {!isLoading && <SaveIcon size={16} aria-hidden="true" />}
                    {editingCategory ? "Save changes" : "Create category"}
                  </Button>
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
