"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Clock, Upload, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  PANEL_CLASS,
  LABEL_CLASS,
  INPUT_CLASS,
  HELP_CLASS,
  BADGE_CLASS,
  BADGE_TONES,
} from "@/components/admin/adminStyles";

interface NewsFormProps {
  initialData?: any;
  isEditing?: boolean;
}

const CATEGORIES = ["Company News", "Healthy Living", "Tips & Tricks", "Organic Farming", "Recipes"];

export default function NewsForm({ initialData, isEditing = false }: NewsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  // Visual-only state: highlights the drop zone while a file is dragged over it
  const [isDragging, setIsDragging] = useState(false);
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

  // Shared by the file picker and drag-and-drop: same size check, same state update
  const processImageFile = (file: File) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    // The picker only offers images (accept="image/*"); mirror that for dropped files
    if (!file || !file.type.startsWith("image/")) return;
    processImageFile(file);
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
      console.error("Save story error:", error);
      toast.error("Failed to save story");
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = formData.imageData || initialData?.image;
  const submitLabel = isEditing ? "Save changes" : formData.isPublished ? "Publish story" : "Save draft";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Content fields (left, wide) */}
        <section aria-labelledby="news-content-title" className={cn(PANEL_CLASS, "space-y-4 p-4 lg:col-span-2")}>
          <h3 id="news-content-title" className="text-base font-semibold text-slate-900">Content</h3>

          <div>
            <label htmlFor="news-title" className={LABEL_CLASS}>Title</label>
            <input
              id="news-title"
              required
              type="text"
              placeholder="e.g. 10 superfoods to boost your immunity"
              className={cn(INPUT_CLASS, "text-base font-medium")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="news-excerpt" className={LABEL_CLASS}>Excerpt</label>
            <textarea
              id="news-excerpt"
              required
              rows={3}
              placeholder="A short summary to hook your readers"
              aria-describedby="news-excerpt-help"
              className={cn(INPUT_CLASS, "resize-none")}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
            <div id="news-excerpt-help" className={cn(HELP_CLASS, "flex justify-between gap-3")}>
              <span>Shown on the news list and story cards. One or two sentences work best.</span>
              <span className="whitespace-nowrap tabular-nums">{formData.excerpt.length} characters</span>
            </div>
          </div>

          <div>
            <label htmlFor="news-content" className={LABEL_CLASS}>Story content</label>
            <textarea
              id="news-content"
              required
              rows={14}
              placeholder="Write your story here"
              aria-describedby="news-content-help"
              className={cn(INPUT_CLASS, "min-h-64 leading-relaxed")}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <p id="news-content-help" className={HELP_CLASS}>
              Plain text. Leave a blank line between paragraphs.
            </p>
          </div>
        </section>

        {/* Meta + image (right) */}
        <section aria-labelledby="news-details-title" className={cn(PANEL_CLASS, "h-fit space-y-4 p-4")}>
          <h3 id="news-details-title" className="text-base font-semibold text-slate-900">Details</h3>

          <div>
            <label htmlFor="news-category" className={LABEL_CLASS}>Category</label>
            <select
              id="news-category"
              className={INPUT_CLASS}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="news-read-time" className={LABEL_CLASS}>Read time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="news-read-time"
                type="text"
                placeholder="e.g. 5 min read"
                className={cn(INPUT_CLASS, "pl-10")}
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            {/* Clicking the label also opens the picker; the button below is the keyboard path */}
            <label htmlFor="news-image" className={LABEL_CLASS}>Cover image</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleImageDrop}
              className={cn(
                "overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"
              )}
            >
              {/* Mouse shortcut kept from the original: clicking the preview area opens the picker.
                  Keyboard and screen-reader users use the "Choose image" button below. */}
              {previewSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video w-full cursor-pointer bg-slate-100"
                >
                  {/* Plain <img>: the preview is a base64 data URL or an arbitrary host next/image is not configured for */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc} alt="Cover image preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center px-3 py-6 text-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                    <ImageIcon size={18} aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">Drag an image here</p>
                  <p className="text-xs text-slate-500">or choose a file from your computer</p>
                </div>
              )}

              <div className={cn("flex justify-center p-3", previewSrc && "border-t border-slate-200 bg-white")}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  aria-describedby="news-image-help"
                  className="h-9"
                >
                  <Upload size={16} aria-hidden="true" />
                  {previewSrc ? "Replace image" : "Choose image"}
                </Button>
              </div>
            </div>
            <p id="news-image-help" className={HELP_CLASS}>Required. Any image file (PNG, JPG, WEBP…), up to 5 MB.</p>

            <input
              id="news-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              tabIndex={-1}
              className="sr-only"
              onChange={handleImageUpload}
            />
          </div>

          {/* Publish switch: a real button so it works with the keyboard; the label toggles it too */}
          <div className="flex items-start justify-between gap-3 border-t border-slate-200 pt-4">
            <div>
              <label htmlFor="news-published" className="block cursor-pointer text-sm font-medium text-slate-700">
                Published
              </label>
              <p id="news-published-help" className="mt-0.5 text-xs text-slate-500">
                {formData.isPublished ? "Visible on the storefront news page." : "Saved as a draft, hidden from customers."}
              </p>
            </div>
            <button
              id="news-published"
              type="button"
              role="switch"
              aria-checked={formData.isPublished}
              aria-describedby="news-published-help"
              onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
              className="flex h-9 flex-shrink-0 items-center"
            >
              <span
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  formData.isPublished ? "bg-brand-600" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                    formData.isPublished ? "left-6" : "left-1"
                  )}
                />
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Sticky action bar: stays in reach while scrolling through long content */}
      {/* One row on phones too, so the bar never covers much of the form; the status badge
          is hidden below sm because the Published switch already shows the state there */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur">
        <span className={cn(BADGE_CLASS, formData.isPublished ? BADGE_TONES.success : BADGE_TONES.neutral, "hidden sm:inline-flex")}>
          <span
            className={cn("h-1.5 w-1.5 rounded-full", formData.isPublished ? "bg-success-500" : "bg-slate-400")}
            aria-hidden="true"
          />
          {formData.isPublished ? "Published" : "Draft"}
        </span>
        <div className="flex flex-1 gap-3 sm:flex-none">
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => router.push("/admin/news")}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} className="flex-1 whitespace-nowrap sm:flex-none">
            {!loading && <Save size={16} aria-hidden="true" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
