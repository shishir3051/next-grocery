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
  Upload,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { HERO_THEMES, findHeroTheme, type HeroTheme } from "@/lib/heroThemes";
import {
  PANEL_CLASS,
  LABEL_CLASS,
  INPUT_CLASS,
  HELP_CLASS,
  BADGE_CLASS,
  BADGE_TONES,
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS
} from "@/components/admin/adminStyles";

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

/** Visual on/off track shared by the row toggles and the form's visibility switch. */
function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-success-600" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </span>
  );
}

/** Radio card wrapper: the real radio is visually hidden, the card shows checked + focus state. */
const THEME_CARD_CLASS =
  "flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:ring-2 peer-checked:ring-brand-500/20 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500";

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  // UI-only: true when the admin explicitly picked "Custom (advanced)" in the theme picker.
  const [showCustomTheme, setShowCustomTheme] = useState(false);
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

  // Close the slide modal with the Escape key while it is open.
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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
    // Start each open on the preset view; custom values still show "Custom" automatically.
    setShowCustomTheme(false);
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

  // Theme picker: a preset writes the same `gradient` + `decorColor` fields the API stores.
  const matchedTheme = findHeroTheme(formData.gradient, formData.decorColor);
  const isCustomTheme = showCustomTheme || !matchedTheme;

  const selectTheme = (theme: HeroTheme) => {
    setShowCustomTheme(false);
    setFormData(prev => ({ ...prev, gradient: theme.gradient, decorColor: theme.decorColor }));
  };

  return (
    <div className="space-y-6">
      {/* Header (the admin shell already shows the page title in its top bar) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Home page banners</h2>
          <p className="text-sm text-slate-500">Manage the slides that rotate at the top of your home page.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="whitespace-nowrap">
          <Plus size={16} aria-hidden="true" /> Add slide
        </Button>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading slides…</span>
        </div>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <ImageIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No slides yet</h3>
          <p className="mt-1 mb-6 text-sm text-slate-500">Create your first banner for the home page.</p>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={16} aria-hidden="true" /> Create slide
          </Button>
        </div>
      ) : (
        <ul className={cn(PANEL_CLASS, "divide-y divide-slate-100 overflow-hidden")}>
          {slides.map((slide) => (
            <motion.li
              key={slide._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {/* Preview swatch: the slide's real gradient, decor and image */}
              <div
                aria-hidden="true"
                className={`relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:h-20 sm:w-40 ${slide.gradient} ${slide.isActive ? "" : "opacity-50 grayscale"}`}
              >
                {slide.image && (
                  <Image src={slide.image} alt="" fill className="object-cover mix-blend-overlay opacity-60" />
                )}
                <span className={`absolute -right-4 -top-4 h-14 w-14 rounded-full ${slide.decorColor}`} />
                <span className="absolute bottom-2 right-2.5 text-2xl leading-none">{slide.emoji}</span>
                {slide.tag && (
                  <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-lg bg-black/25 px-2 py-0.5 text-xs font-semibold text-white">
                    {slide.tag}
                  </span>
                )}
              </div>

              {/* Slide details */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {slide.title}{" "}
                  {slide.highlight && <span className="font-normal text-slate-500">{slide.highlight}</span>}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{slide.subtitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-slate-400" aria-hidden="true" />
                    Button: <span className="font-medium text-slate-700">{slide.ctaLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-slate-400" aria-hidden="true" />
                    {slide.image ? "Custom image" : "Gradient only"}
                  </span>
                  <span className={cn(BADGE_CLASS, BADGE_TONES.neutral)}>Order {slide.order}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  type="button"
                  role="switch"
                  aria-checked={slide.isActive}
                  onClick={() => toggleActive(slide)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-slate-100"
                >
                  <SwitchTrack on={slide.isActive} />
                  <span className={cn("w-14 text-left", slide.isActive ? "text-success-700" : "text-slate-500")}>
                    {slide.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="sr-only">: show “{slide.title}” on the home page</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal(slide)}
                  aria-label={`Edit slide “${slide.title}”`}
                  title="Edit"
                  className={ICON_BUTTON_CLASS}
                >
                  <Edit3 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => slide._id && handleDelete(slide._id)}
                  aria-label={`Delete slide “${slide.title}”`}
                  title="Delete"
                  className={ICON_BUTTON_DANGER_CLASS}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
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
              className="absolute inset-0 bg-slate-900/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="hero-modal-title"
              aria-describedby="hero-modal-description"
              className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div className="min-w-0">
                  <h2 id="hero-modal-title" className="text-lg font-semibold text-slate-900">
                    {editingSlide ? "Edit slide" : "Create new slide"}
                  </h2>
                  <p id="hero-modal-description" className="text-sm text-slate-500">
                    Shown in the slider at the top of the home page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                  className={ICON_BUTTON_CLASS}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                {/* Scrollable fields; the action bar below stays visible */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left column: content */}
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="hero-title" className={LABEL_CLASS}>Main title</label>
                        <input
                          id="hero-title"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="e.g. Fresh Groceries"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label htmlFor="hero-highlight" className={LABEL_CLASS}>Highlight text</label>
                        <input
                          id="hero-highlight"
                          value={formData.highlight}
                          onChange={(e) => setFormData({...formData, highlight: e.target.value})}
                          placeholder="e.g. delivered in 60 mins"
                          aria-describedby="hero-highlight-help"
                          className={INPUT_CLASS}
                        />
                        <p id="hero-highlight-help" className={HELP_CLASS}>Shown after the title in a contrasting colour.</p>
                      </div>
                      <div>
                        <label htmlFor="hero-subtitle" className={LABEL_CLASS}>Subtitle</label>
                        <textarea
                          id="hero-subtitle"
                          required
                          value={formData.subtitle}
                          onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                          rows={3}
                          placeholder="Provide some catchy details..."
                          className={cn(INPUT_CLASS, "resize-none")}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="hero-cta-label" className={LABEL_CLASS}>Button label</label>
                          <input
                            id="hero-cta-label"
                            value={formData.ctaLabel}
                            onChange={(e) => setFormData({...formData, ctaLabel: e.target.value})}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label htmlFor="hero-cta-link" className={LABEL_CLASS}>Button link</label>
                          <input
                            id="hero-cta-link"
                            value={formData.ctaLink}
                            onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
                            aria-describedby="hero-cta-link-help"
                            className={INPUT_CLASS}
                          />
                          <p id="hero-cta-link-help" className={HELP_CLASS}>Category slug or full URL.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="hero-tag" className={LABEL_CLASS}>Badge text</label>
                          <input
                            id="hero-tag"
                            value={formData.tag}
                            onChange={(e) => setFormData({...formData, tag: e.target.value})}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label htmlFor="hero-emoji" className={LABEL_CLASS}>Emoji icon</label>
                          <input
                            id="hero-emoji"
                            value={formData.emoji}
                            onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="hero-order" className={LABEL_CLASS}>Order</label>
                          <input
                            id="hero-order"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                            aria-describedby="hero-order-help"
                            className={INPUT_CLASS}
                          />
                          <p id="hero-order-help" className={HELP_CLASS}>Lower numbers show first.</p>
                        </div>
                        <div>
                          <label id="hero-visibility-label" htmlFor="hero-visibility" className={LABEL_CLASS}>Visibility</label>
                          <button
                            id="hero-visibility"
                            type="button"
                            role="switch"
                            aria-checked={formData.isActive}
                            aria-labelledby="hero-visibility-label hero-visibility-state"
                            onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                            className="flex h-11 w-full items-center gap-3 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <SwitchTrack on={formData.isActive} />
                            <span id="hero-visibility-state">
                              {formData.isActive ? "Visible on home page" : "Hidden"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right column: media & styling */}
                    <div className="space-y-5">
                      <div>
                        <p id="hero-image-label" className={LABEL_CLASS}>Background image</p>
                        {formData.image ? (
                          <div className="relative h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <Image src={formData.image} alt="Background image preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, image: ""})}
                              aria-label="Remove image"
                              className={cn(ICON_BUTTON_DANGER_CLASS, "absolute right-2 top-2 bg-white/90 shadow-sm")}
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          // The transparent file input covers the whole zone, so it accepts both clicks and dropped files
                          <label
                            htmlFor="hero-image"
                            className="relative flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
                          >
                            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                              <Upload size={18} className="text-slate-500" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              Drop an image or click to upload
                            </span>
                            <span id="hero-image-help" className="mt-1 text-xs text-slate-500">
                              Optional. Leave empty to use the gradient only.
                            </span>
                            <input
                              id="hero-image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageFile}
                              aria-labelledby="hero-image-label"
                              aria-describedby="hero-image-help"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </label>
                        )}
                      </div>

                      {/* Theme picker: presets are literal classes in src/lib/heroThemes.ts, so Tailwind always generates them */}
                      <fieldset>
                        <legend className={LABEL_CLASS}>Background theme</legend>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {HERO_THEMES.map((theme) => {
                            const isChecked = !isCustomTheme && matchedTheme?.id === theme.id;
                            return (
                              <label key={theme.id} className="relative block cursor-pointer">
                                <input
                                  type="radio"
                                  name="hero-theme"
                                  value={theme.id}
                                  checked={isChecked}
                                  onChange={() => selectTheme(theme)}
                                  className="peer sr-only"
                                />
                                <span className={THEME_CARD_CLASS}>
                                  <span
                                    aria-hidden="true"
                                    className={`relative block h-10 overflow-hidden rounded-lg bg-gradient-to-br ${theme.gradient}`}
                                  >
                                    <span className={`absolute -right-2 -top-2 h-7 w-7 rounded-full ${theme.decorColor}`} />
                                  </span>
                                  <span className="flex items-center justify-between gap-1 px-0.5 text-sm font-medium text-slate-700">
                                    {theme.label}
                                    {isChecked && <Check size={14} className="text-brand-600" aria-hidden="true" />}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                          <label className="relative block cursor-pointer">
                            <input
                              type="radio"
                              name="hero-theme"
                              value="custom"
                              checked={isCustomTheme}
                              onChange={() => setShowCustomTheme(true)}
                              className="peer sr-only"
                            />
                            <span className={THEME_CARD_CLASS}>
                              <span
                                aria-hidden="true"
                                className="flex h-10 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500"
                              >
                                <SlidersHorizontal size={16} />
                              </span>
                              <span className="flex items-center justify-between gap-1 px-0.5 text-sm font-medium text-slate-700">
                                Custom
                                {isCustomTheme && <Check size={14} className="text-brand-600" aria-hidden="true" />}
                              </span>
                            </span>
                          </label>
                        </div>

                        {isCustomTheme && (
                          <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">Advanced.</span>{" "}
                              Tailwind only generates classes already used in the app&apos;s code, so
                              hand-typed classes may not render. Prefer a preset when possible.
                            </p>
                            <div>
                              <label htmlFor="hero-gradient" className={LABEL_CLASS}>Gradient classes</label>
                              <input
                                id="hero-gradient"
                                value={formData.gradient}
                                onChange={(e) => setFormData({...formData, gradient: e.target.value})}
                                placeholder="e.g. from-teal-600 via-emerald-600 to-teal-800"
                                className={cn(INPUT_CLASS, "font-mono text-xs")}
                              />
                            </div>
                            <div>
                              <label htmlFor="hero-decor" className={LABEL_CLASS}>Decor colour class</label>
                              <input
                                id="hero-decor"
                                value={formData.decorColor}
                                onChange={(e) => setFormData({...formData, decorColor: e.target.value})}
                                placeholder="e.g. bg-emerald-400/20"
                                className={cn(INPUT_CLASS, "font-mono text-xs")}
                              />
                            </div>
                          </div>
                        )}
                      </fieldset>

                      {/* Live preview (mirrors the storefront HeroBanner at a smaller size) */}
                      <div className="border-t border-slate-200 pt-5">
                        <p className={LABEL_CLASS}>Live preview</p>
                        <div className={`relative flex aspect-[2/1] w-full flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white ${formData.gradient}`}>
                          {formData.image && <Image src={formData.image} alt="" fill className="object-cover mix-blend-overlay opacity-60" />}
                          <span aria-hidden="true" className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${formData.decorColor}`} />
                          <span aria-hidden="true" className={`absolute -bottom-10 left-1/3 h-24 w-24 rounded-full ${formData.decorColor}`} />
                          <div className="relative z-10">
                            <span className="mb-2 inline-block rounded-lg bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                              {formData.tag || "Sample tag"}
                            </span>
                            {/* Display heading: font-black mirrors the storefront hero */}
                            <h3 className="mb-1 text-lg font-black leading-tight">
                              {formData.title || "Dynamic hero"}{" "}
                              {formData.highlight && <span className={formData.accentColor}>{formData.highlight}</span>}
                            </h3>
                            <p className="line-clamp-2 text-xs text-white/90">
                              {formData.subtitle || "Your content will appear here."}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex h-7 items-center rounded-lg bg-white px-3 text-xs font-semibold text-brand-700">
                                {formData.ctaLabel}
                              </span>
                              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
                                {formData.emoji}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">
                    <Save size={16} aria-hidden="true" />
                    {editingSlide ? "Save changes" : "Create slide"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
