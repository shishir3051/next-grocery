/**
 * Shared class names for admin screens (see docs/design/DESIGN_SYSTEM.md).
 * Import these instead of re-declaring table, form and badge styles per page.
 */

/** White content panel: tables, forms, stat cards. */
export const PANEL_CLASS = "bg-white rounded-2xl border border-slate-200 shadow-sm";

/** Table header cell: readable, sentence case (no 10px uppercase). */
export const TH_CLASS = "px-4 py-3 text-xs font-semibold text-slate-600";
/** Table body cell. */
export const TD_CLASS = "px-4 py-3 text-sm text-slate-700";

/** Form label, always tied to its input with htmlFor/id. */
export const LABEL_CLASS = "block text-sm font-medium text-slate-700 mb-1.5";
/** Text input / select / textarea with a visible border and brand focus ring. */
export const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
/** Helper text under a field. */
export const HELP_CLASS = "mt-1.5 text-xs text-slate-500";

/** Pagination page button (combine with an active/idle colour). */
export const PAGE_BUTTON_CLASS = "flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

/** Status pill base; add one of BADGE_TONES for colour. Always contains text, never colour alone. */
export const BADGE_CLASS = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium";
export const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-success-50 text-success-700 border-success-100",
  warning: "bg-accent-50 text-accent-800 border-accent-200",
  danger: "bg-danger-50 text-danger-700 border-danger-200",
} as const;

/** Square icon-only action button in table rows (always pass an aria-label). */
export const ICON_BUTTON_CLASS =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800";
export const ICON_BUTTON_DANGER_CLASS =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-700";
