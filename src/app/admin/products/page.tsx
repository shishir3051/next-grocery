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
  RefreshCw,
  Save as SaveIcon
} from "lucide-react";
import Image from "next/image";
import SafeImage from "@/components/ui/SafeImage";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LABEL_CLASS, INPUT_CLASS, TH_CLASS, PAGE_BUTTON_CLASS } from "@/components/admin/adminStyles";

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

/** A row of the products table. `imageData` is a short image URL here, never base64. */
type ProductRow = {
  _id: string;
  name: string;
  unit?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images?: string[];
  imageData?: string;
  category?: { name?: string } | string | null;
};

type ProductPage = { products: ProductRow[]; total: number; totalPages: number };

type CategoryNode = { _id: string; name: string; subcategories?: CategoryNode[] };
type CategoryOption = CategoryNode & { displayName: string };

const EMPTY_FORM = {
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
};

function categoryName(category: ProductRow["category"]) {
  return (typeof category === "object" ? category?.name : category) || "";
}

/** Thumbnail: our own image URLs are resized by next/image; outside URLs are shown as they are. */
function Thumbnail({ product }: { product: ProductRow }) {
  const src = product.imageData || product.images?.[0];
  if (!src) return <ImageIcon className="w-5 h-5 text-slate-400 absolute inset-0 m-auto" aria-hidden="true" />;
  return <SafeImage src={src} alt="" fill sizes="40px" unoptimized={!src.startsWith("/")} className="object-cover" />;
}

export default function AdminProductsPage() {
  // Table data: one page at a time from the server.
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  // The request the table shows. While it differs from the one asked for, a load is running.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Search (debounced) and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Add / edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const originalImageRef = useRef("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation modal
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

  // Categories for the form's dropdown, flattened as "Parent — Child".
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { categories: CategoryNode[] }) => {
        const flat: CategoryOption[] = [];
        for (const cat of data.categories) {
          flat.push({ ...cat, displayName: cat.name });
          for (const sub of cat.subcategories ?? []) flat.push({ ...sub, displayName: `${cat.name} — ${sub.name}` });
        }
        setCategories(flat);
        if (flat.length > 0) setFormData((prev) => ({ ...prev, category: prev.category || flat[0].name }));
      })
      .catch((error) => console.error("Fetch categories error:", error));
  }, []);

  // Wait until typing pauses before searching, and start again from page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchTerm.trim());
      setCurrentPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const requestKey = `${currentPage}|${query}|${reloadKey}`;
  const isFetching = loadedKey !== requestKey;

  // Load the current page. A newer request cancels an older one still in flight.
  useEffect(() => {
    const controller = new AbortController();
    const key = `${currentPage}|${query}|${reloadKey}`;
    const params = new URLSearchParams({ page: String(currentPage), pageSize: String(PAGE_SIZE) });
    if (query) params.set("q", query);

    fetch(`/api/admin/products?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ProductPage = await res.json();
        setRows(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setStatus("ready");
        setLoadedKey(key);
        // After deleting the last product on the last page, step back a page.
        if (currentPage > data.totalPages) setCurrentPage(data.totalPages);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Fetch products error:", error);
        setStatus("error");
        setLoadedKey(key);
      });

    return () => controller.abort();
  }, [currentPage, query, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSaveError(null);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setSaveError(null);
    originalImageRef.current = "";
    setFormData({ ...EMPTY_FORM, category: categories[0]?.name || "" });
    setIsModalOpen(true);
  };

  /** The table has no descriptions or full photos, so the form loads the whole product first. */
  const openEditModal = async (product: ProductRow) => {
    setEditingProduct(product);
    setSaveError(null);
    setIsModalOpen(true);
    setIsLoadingProduct(true);
    try {
      const res = await fetch(`/api/admin/products?id=${product._id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { product: full } = await res.json();
      const image = full.imageData || full.images?.[0] || "";
      originalImageRef.current = image;
      setFormData({
        name: full.name,
        price: String(full.price),
        discountPrice: String(full.discountPrice || ""),
        category: categoryName(full.category),
        unit: full.unit,
        stock: String(full.stock),
        description: full.description || "",
        imageData: image,
        isOrganic: !!full.isOrganic,
        isHalal: !!full.isHalal
      });
    } catch (error) {
      console.error("Load product error:", error);
      setSaveError("Couldn't load this product. Close the form and try again.");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = editingProduct ? { ...formData, id: editingProduct._id } : { ...formData };
      // Don't send the (large) photo again when it wasn't changed.
      if (editingProduct && formData.imageData === originalImageRef.current) delete body.imageData;

      const res = await fetch("/api/admin/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || data.message || "Couldn't save the product. Please try again.");
        return;
      }
      closeModal();
      setFormData({ ...EMPTY_FORM, category: categories[0]?.name || "" });
      reload();
    } catch (error) {
      console.error("Save error:", error);
      setSaveError("Couldn't save the product. Check your connection and try again.");
    } finally {
      setIsSaving(false);
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
            if (res.ok) reload();
          } catch (error) {
            console.error("Delete error:", error);
          }
        }
    });
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

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(currentPage * PAGE_SIZE, total);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2));

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
            <Button size="sm" onClick={openCreateModal} className="whitespace-nowrap">
              <Plus size={16} aria-hidden="true" /> Add product
            </Button>
        </div>
      </div>

      {status === "error" ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-danger-700">Products couldn&apos;t be loaded. Check your connection and try again.</p>
          <Button size="sm" variant="secondary" onClick={() => { setStatus("loading"); reload(); }}>
            <RefreshCw size={16} aria-hidden="true" /> Try again
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Visible loading state: first load and every page change or search */}
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-center gap-2 border-b border-slate-200 bg-brand-50/60 px-4 py-2 text-sm font-medium text-brand-700",
              !isFetching && "sr-only"
            )}
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isFetching ? (status === "loading" ? "Loading products…" : "Updating products…") : `${total} products loaded`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]" aria-busy={isFetching}>
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
              <tbody className={cn("divide-y divide-slate-100 text-sm text-slate-700 transition-opacity", isFetching && status === "ready" && "opacity-60")}>
                {status === "loading" &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={`skeleton-${i}`} aria-hidden="true">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-40 rounded bg-slate-100 animate-pulse" />
                            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: 5 }, (_, j) => (
                        <td key={j} className="px-3 py-2">
                          <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {status === "ready" && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      {query ? `No products match "${query}".` : "No products yet. Add your first product to get started."}
                    </td>
                  </tr>
                )}
                {status === "ready" && rows.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          <Thumbnail product={product} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.unit || 'per unit'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {categoryName(product.category) || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 tabular-nums">৳{product.price}</span>
                        {/* discountPrice is the sale price, so the saving is price - discountPrice */}
                        {(product.discountPrice ?? 0) > 0 && (
                          <span className="text-xs font-medium text-accent-700">Save ৳{product.price - (product.discountPrice ?? 0)}</span>
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
              Showing <span className="font-semibold text-slate-900">{firstShown}</span>–<span className="font-semibold text-slate-900">{lastShown}</span> of <span className="font-semibold text-slate-900">{total}</span> products
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1 || isFetching}
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={currentPage === n ? "page" : undefined}
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    currentPage === n
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages || isFetching}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-900/50" />
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
                  onClick={closeModal}
                  aria-label="Close"
                  className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              {isLoadingProduct ? (
                <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-600">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-600" aria-hidden="true" />
                  Loading product…
                </div>
              ) : (
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
                        {categories.map((cat) => (
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
                              <Image src={formData.imageData} alt="Product image preview" fill sizes="64px" unoptimized className="object-cover" />
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
                            <p id="product-image-help" className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP, up to 2 MB</p>
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

                <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-3">
                  {saveError && (
                    <p role="alert" className="text-sm font-medium text-danger-700">{saveError}</p>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" size="sm" loading={isSaving}>
                      {!isSaving && <SaveIcon size={16} aria-hidden="true" />}
                      {editingProduct ? "Save changes" : "Create product"}
                    </Button>
                  </div>
                </div>
              </form>
              )}
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
