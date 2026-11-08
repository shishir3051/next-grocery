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
  Ticket,
  Calendar,
  ChevronLeft,
  ChevronRight,
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

// Options for the segmented "Discount type" radio group in the coupon form
const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed amount (৳)" }
] as const;

// Idle (non-active) style shared by the prev/next and page-number buttons
const PAGE_IDLE_CLASS = "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "0",
    maxDiscount: "",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    usageLimit: ""
  });

  // Modal State for confirmations
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: 'warning' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Close the coupon modal with the Escape key (only listens while it is open)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error("Fetch coupons error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = editingCoupon ? "PUT" : "POST";
      const body = editingCoupon ? { ...formData, id: editingCoupon._id } : formData;

      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "0",
      maxDiscount: "",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      usageLimit: ""
    });
  };

  const handleDelete = async (id: string) => {
    setModalConfig({
        isOpen: true,
        title: "Delete Coupon",
        message: "Are you sure? This coupon will be removed permanently and can no longer be used by customers.",
        type: 'danger',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchCoupons();
          } catch (error) { console.error("Delete error:", error); }
        }
    });
  };

  const openEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
      maxDiscount: (coupon.maxDiscount || "").toString(),
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
      usageLimit: (coupon.usageLimit || "").toString()
    });
    setIsModalOpen(true);
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = filteredCoupons.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastShown = Math.min(currentPage * itemsPerPage, filteredCoupons.length);

  return (
    <div className="space-y-4">
      {/* Header & toolbar (the admin shell already shows the "Coupons" page title) */}
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Discount coupons</h2>
          <p className="text-sm text-slate-500">Create promo codes, set spending rules and track how often they are used.</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <label htmlFor="coupon-search" className="sr-only">Search coupons</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
            <input
              id="coupon-search"
              type="search"
              placeholder="Search coupons by code"
              className={cn(INPUT_CLASS, "pl-10")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="whitespace-nowrap"
          >
            <Plus size={16} aria-hidden="true" /> Create coupon
          </Button>
        </div>
      </div>

      {isLoading && coupons.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading coupons…</span>
        </div>
      ) : (
        <div className={cn(PANEL_CLASS, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className={TH_CLASS}>Coupon code</th>
                  <th scope="col" className={TH_CLASS}>Discount</th>
                  <th scope="col" className={TH_CLASS}>Rules</th>
                  <th scope="col" className={TH_CLASS}>Usage</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCoupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      {searchTerm ? `No coupons match "${searchTerm}".` : "No coupons yet. Create your first coupon to get started."}
                    </td>
                  </tr>
                )}
                {paginatedCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  const expiryLabel = new Date(coupon.expiryDate).toLocaleDateString();
                  // Usage limit is optional; when set, show progress towards it
                  const usagePercent = coupon.usageLimit ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100) : 0;
                  const isExhausted = !!coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                  return (
                    <tr key={coupon._id} className="hover:bg-slate-50 transition-colors">
                      {/* Code: monospace chip so codes are easy to read and copy */}
                      <td className={TD_CLASS}>
                        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                          <Ticket size={14} className="text-brand-600 flex-shrink-0" aria-hidden="true" />
                          <span className="font-mono font-semibold text-slate-900">{coupon.code}</span>
                        </span>
                      </td>

                      <td className={TD_CLASS}>
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `৳${coupon.discountValue} off`}
                        </p>
                        {coupon.maxDiscount ? (
                          <p className="text-xs text-slate-500 tabular-nums">Up to ৳{coupon.maxDiscount}</p>
                        ) : null}
                      </td>

                      <td className={TD_CLASS}>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 tabular-nums">Min. order ৳{coupon.minOrderAmount}</p>
                          <p className={cn(
                            "flex items-center gap-1.5 text-xs tabular-nums",
                            isExpired ? "font-medium text-danger-700" : "text-slate-600"
                          )}>
                            <Calendar size={14} aria-hidden="true" />
                            {isExpired ? `Expired ${expiryLabel}` : `Expires ${expiryLabel}`}
                          </p>
                        </div>
                      </td>

                      <td className={TD_CLASS}>
                        <p className="tabular-nums">
                          <span className="font-semibold text-slate-900">{coupon.usedCount}</span>{" "}
                          <span className="text-slate-600">used</span>
                        </p>
                        {coupon.usageLimit ? (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div
                              role="progressbar"
                              aria-label={`Usage of ${coupon.code}`}
                              aria-valuemin={0}
                              aria-valuemax={coupon.usageLimit}
                              aria-valuenow={Math.min(coupon.usedCount, coupon.usageLimit)}
                              className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"
                            >
                              <div
                                className={cn("h-full rounded-full", isExhausted ? "bg-danger-600" : "bg-brand-600")}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className={cn("text-xs tabular-nums", isExhausted ? "font-medium text-danger-700" : "text-slate-500")}>
                              of {coupon.usageLimit}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-xs text-slate-500">Unlimited</p>
                        )}
                      </td>

                      <td className={TD_CLASS}>
                        {!coupon.isActive ? (
                          <span className={cn(BADGE_CLASS, BADGE_TONES.neutral)}>Inactive</span>
                        ) : isExpired ? (
                          <span className={cn(BADGE_CLASS, BADGE_TONES.danger)}>Expired</span>
                        ) : (
                          <span className={cn(BADGE_CLASS, BADGE_TONES.success)}>
                            <span className="h-1.5 w-1.5 rounded-full bg-success-600" aria-hidden="true" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className={cn(TD_CLASS, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            aria-label={`Edit coupon ${coupon.code}`}
                            title="Edit"
                            className={ICON_BUTTON_CLASS}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon._id)}
                            aria-label={`Delete coupon ${coupon.code}`}
                            title="Delete"
                            className={ICON_BUTTON_DANGER_CLASS}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <nav
            aria-label="Coupons pagination"
            className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{firstShown}</span>–<span className="font-semibold text-slate-900">{lastShown}</span> of <span className="font-semibold text-slate-900">{filteredCoupons.length}</span> coupons
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, PAGE_IDLE_CLASS, "disabled:opacity-40 disabled:cursor-not-allowed")}
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
                  className={cn(PAGE_BUTTON_CLASS, currentPage === i+1 ? "bg-brand-600 text-white" : PAGE_IDLE_CLASS)}
                >
                  {i+1}
                </button>
              )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                aria-label="Next page"
                className={cn(PAGE_BUTTON_CLASS, PAGE_IDLE_CLASS, "disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Coupon Modal */}
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
              aria-labelledby="coupon-modal-title"
              className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h2 id="coupon-modal-title" className="text-base font-semibold text-slate-900">
                  {editingCoupon ? "Edit coupon" : "Create coupon"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                  className={ICON_BUTTON_CLASS}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                {/* Scrollable fields; the action bar below stays visible */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  <div>
                    <label htmlFor="coupon-code" className={LABEL_CLASS}>Coupon code</label>
                    <input id="coupon-code" required type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER50" className={cn(INPUT_CLASS, "font-mono font-semibold")} />
                  </div>

                  {/* Discount type as a segmented radio group (same values as the old select) */}
                  <fieldset>
                    <legend className={LABEL_CLASS}>Discount type</legend>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-300 bg-slate-50 p-1">
                      {DISCOUNT_TYPE_OPTIONS.map((option) => {
                        const isSelected = formData.discountType === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex min-h-8 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                              isSelected ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            <input
                              type="radio"
                              name="discountType"
                              value={option.value}
                              checked={isSelected}
                              onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="coupon-value" className={LABEL_CLASS}>
                        Discount value ({formData.discountType === 'percentage' ? '%' : '৳'})
                      </label>
                      <input id="coupon-value" required type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} placeholder={formData.discountType === 'percentage' ? "10" : "50"} className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label htmlFor="coupon-min-order" className={LABEL_CLASS}>Minimum order (৳)</label>
                      <input id="coupon-min-order" type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})} placeholder="0" className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label htmlFor="coupon-max-discount" className={LABEL_CLASS}>Max discount (৳)</label>
                      <input
                        id="coupon-max-discount"
                        type="number"
                        disabled={formData.discountType === 'fixed'}
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                        placeholder={formData.discountType === 'fixed' ? "Not applicable" : "No cap"}
                        aria-describedby="coupon-max-discount-help"
                        className={cn(INPUT_CLASS, "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400")}
                      />
                      <p id="coupon-max-discount-help" className={HELP_CLASS}>
                        {formData.discountType === 'fixed'
                          ? "Only used for percentage discounts."
                          : "Optional cap on the percentage discount."}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="coupon-usage-limit" className={LABEL_CLASS}>Usage limit</label>
                      <input id="coupon-usage-limit" type="number" value={formData.usageLimit} onChange={(e) => setFormData({...formData, usageLimit: e.target.value})} placeholder="Unlimited" aria-describedby="coupon-usage-limit-help" className={INPUT_CLASS} />
                      <p id="coupon-usage-limit-help" className={HELP_CLASS}>Total redemptions allowed. Leave empty for unlimited.</p>
                    </div>
                    <div>
                      <label htmlFor="coupon-expiry" className={LABEL_CLASS}>Expiry date</label>
                      <input id="coupon-expiry" required type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className={INPUT_CLASS} />
                    </div>
                  </div>

                  <label htmlFor="coupon-active" className="flex min-h-9 items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
                    <input id="coupon-active" type="checkbox" className="h-5 w-5 cursor-pointer accent-brand-600" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
                    Active (customers can use this coupon)
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
                  <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" loading={isLoading}>
                    {!isLoading && <SaveIcon size={16} aria-hidden="true" />}
                    {editingCoupon ? "Save changes" : "Create coupon"}
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
        confirmText="Delete"
      />
    </div>
  );
}
