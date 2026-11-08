"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Save as SaveIcon
} from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LABEL_CLASS, INPUT_CLASS, TH_CLASS, PAGE_BUTTON_CLASS } from "@/components/admin/adminStyles";


export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    category: "",
    unit: "1 kg",
    stock: "100",
    description: "",
    imageData: "",
    isOrganic: false,
    isHalal: false
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        // Flatten the category tree for the dropdown
        const flatCategories: any[] = [];
        data.categories.forEach((cat: any) => {
          flatCategories.push({ ...cat, displayName: cat.name });
          if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach((sub: any) => {
              flatCategories.push({ ...sub, displayName: `${cat.name} — ${sub.name}` });
            });
          }
        });
        
        setCategories(flatCategories);
        if (flatCategories.length > 0) {
            setFormData(prev => ({ ...prev, category: prev.category || flatCategories[0].name }));
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct ? { ...formData, id: editingProduct._id } : formData;
      
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            name: "", price: "", discountPrice: "", category: categories[0]?.name || "", 
            unit: "1 kg", stock: "100", description: "", imageData: "",
            isOrganic: false, isHalal: false
        });
        fetchProducts();
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
        title: "Delete Product",
        message: "Are you sure you want to delete this product? This will remove it from the storefront permanently.",
        type: 'danger',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
            if (res.ok) {
              fetchProducts();
            }
          } catch (error) {
            console.error("Delete error:", error);
          }
        }
    });
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
    setFormData({
      name: product.name,
      price: product.price.toString(),
      discountPrice: (product.discountPrice || "").toString(),
      category: categoryName || "",
      unit: product.unit,
      stock: product.stock.toString(),
      description: product.description || "",
      imageData: product.imageData || product.images?.[0] || "",
      isOrganic: !!product.isOrganic,
      isHalal: !!product.isHalal
    });
    setIsModalOpen(true);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, imageData: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const filteredProducts = products.filter(p => {
    const catName = typeof p.category === 'object' ? p.category?.name : p.category;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (catName && catName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastShown = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  // Keyboard support for the click-to-upload drop zone
  const handleDropZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & toolbar */}
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Inventory management</h2>
          <p className="text-sm text-slate-500">Control your stock, pricing, and product visibility.</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="product-search" className="sr-only">Search products</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
              <input
                id="product-search"
                type="search"
                placeholder="Search by name or category"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(INPUT_CLASS, "pl-10")}
              />
            </div>
            <Button
              size="sm"
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="whitespace-nowrap"
            >
              <Plus size={16} aria-hidden="true" /> Add product
            </Button>
        </div>
      </div>

      {isLoading && products.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading products…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className={TH_CLASS}>Product</th>
                  <th scope="col" className={TH_CLASS}>Category</th>
                  <th scope="col" className={TH_CLASS}>Price</th>
                  <th scope="col" className={TH_CLASS}>Stock</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      {searchTerm ? `No products match "${searchTerm}".` : "No products yet. Add your first product to get started."}
                    </td>
                  </tr>
                )}
                {paginatedProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          {product.imageData || product.images?.[0] ? (
                            <Image
                              src={product.imageData || product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 absolute inset-0 m-auto" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.unit || 'per unit'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {(typeof product.category === 'object' ? product.category?.name : product.category) || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 tabular-nums">৳{product.price}</span>
                        {/* discountPrice is the sale price, so the saving is price - discountPrice */}
                        {product.discountPrice > 0 && (
                          <span className="text-xs font-medium text-accent-700">Save ৳{product.price - product.discountPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("tabular-nums", product.stock < 10 ? "font-semibold text-danger-700" : "text-slate-700")}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                          <Check size={12} strokeWidth={3} aria-hidden="true" /> In stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700">
                          <X size={12} strokeWidth={3} aria-hidden="true" /> Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit"
                          className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        >
                          <Edit3 size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          aria-label={`Delete ${product.name}`}
                          title="Delete"
                          className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-danger-50 hover:text-danger-700 transition-colors"
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

          {/* Pagination Controls */}
          <nav
            aria-label="Products pagination"
            className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{firstShown}</span>–<span className="font-semibold text-slate-900">{lastShown}</span> of <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i+1}
                  onClick={() => setCurrentPage(i+1)}
                  aria-label={`Page ${i+1}`}
                  aria-current={currentPage === i+1 ? "page" : undefined}
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    currentPage === i+1
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {i+1}
                </button>
              )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                aria-label="Next page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Product Modal */}
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
              aria-labelledby="product-modal-title"
              className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h2 id="product-modal-title" className="text-base font-semibold text-slate-900">
                  {editingProduct ? "Edit product" : "Add new product"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                {/* Scrollable fields; the action bar below stays visible */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-name" className={LABEL_CLASS}>Product name</label>
                      <input id="product-name" required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Organic red apples" className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label htmlFor="product-category" className={LABEL_CLASS}>Category</label>
                      <select id="product-category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={cn(INPUT_CLASS, "cursor-pointer")}>
                        {categories.map((cat: any) => (
                          <option key={cat._id} value={cat.name}>{cat.displayName || cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="product-price" className={LABEL_CLASS}>Regular price (৳)</label>
                      <input id="product-price" required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="120" className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label htmlFor="product-discount" className={LABEL_CLASS}>Sale price (৳)</label>
                      <input id="product-discount" type="number" value={formData.discountPrice} onChange={(e) => setFormData({...formData, discountPrice: e.target.value})} placeholder="100" aria-describedby="product-discount-help" className={INPUT_CLASS} />
                      <p id="product-discount-help" className="mt-1 text-xs text-slate-500">Optional. Leave empty if the product is not on sale.</p>
                    </div>
                    <div>
                      <label htmlFor="product-unit" className={LABEL_CLASS}>Unit</label>
                      <input id="product-unit" required type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="1 kg" className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label htmlFor="product-stock" className={LABEL_CLASS}>Current stock</label>
                      <input id="product-stock" required type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="50" className={INPUT_CLASS} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p id="product-image-label" className={LABEL_CLASS}>Product image</p>
                    {/* The remove button sits beside (not inside) the drop zone so the two controls are never nested */}
                    <div className="relative">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-labelledby="product-image-label"
                        aria-describedby="product-image-help"
                        onKeyDown={handleDropZoneKeyDown}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors",
                          isDragging
                            ? "border-brand-500 bg-brand-50"
                            : formData.imageData
                              ? "border-brand-200 bg-brand-50/40"
                              : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/40"
                        )}
                      >
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" tabIndex={-1} onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                        {formData.imageData ? (
                          <div className="flex items-center gap-3 p-3 pr-14">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
                              <Image src={formData.imageData} alt="Product image preview" fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">Image uploaded</p>
                              <p id="product-image-help" className="text-xs text-slate-500 mt-1">Click or drag a new file to replace it</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                              <Upload size={18} className="text-slate-500" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Drop an image here or <span className="text-brand-700 underline underline-offset-2">browse</span></p>
                            <p id="product-image-help" className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP, up to 5 MB</p>
                          </div>
                        )}
                      </div>
                      {formData.imageData && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, imageData: '' })); }}
                          aria-label="Remove image"
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <fieldset className="mt-4">
                    <legend className={LABEL_CLASS}>Labels</legend>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <label className="flex min-h-9 items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
                        <input type="checkbox" className="h-5 w-5 cursor-pointer accent-brand-600" checked={formData.isOrganic} onChange={(e) => setFormData({...formData, isOrganic: e.target.checked})} />
                        Organic
                      </label>
                      <label className="flex min-h-9 items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
                        <input type="checkbox" className="h-5 w-5 cursor-pointer accent-brand-600" checked={formData.isHalal} onChange={(e) => setFormData({...formData, isHalal: e.target.checked})} />
                        Halal
                      </label>
                    </div>
                  </fieldset>

                  <div className="mt-4">
                    <label htmlFor="product-description" className={LABEL_CLASS}>Description</label>
                    <textarea id="product-description" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the product's freshness, origin, etc." className={cn(INPUT_CLASS, "resize-none")} />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
                  <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" loading={isLoading}>
                    {!isLoading && <SaveIcon size={16} aria-hidden="true" />}
                    {editingProduct ? "Save changes" : "Create product"}
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
        confirmText={modalConfig.type === 'danger' ? "Delete Product" : "Confirm"}
      />
    </div>
  );
}
