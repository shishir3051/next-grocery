/**
 * Named colour themes for the home page hero banner.
 *
 * Why this file exists: Tailwind v4 only generates CSS for class names it can
 * find written out in the source code. A gradient that an admin types into a
 * form (e.g. "from-orange-500 to-red-600") is stored in the database and never
 * appears in the source, so it usually renders as nothing. Every class string
 * below is a LITERAL, so Tailwind sees it and always generates it.
 *
 * Each theme writes the same two fields the HeroSlide model already stores:
 * - `gradient`: used as `bg-gradient-to-br ${gradient}` on the banner
 * - `decorColor`: background of the soft decorative circles on the banner
 *
 * The hero banner is the one place where the design system allows gradients
 * and colours beyond the UI tokens (see docs/design/DESIGN_SYSTEM.md), so the
 * themes may use the wider Tailwind palette for seasonal/category banners.
 */

export interface HeroTheme {
  /** Stable id, used as the radio value in the admin form. */
  id: string;
  /** Human-readable name shown in the picker. */
  label: string;
  /** Tailwind gradient stops, combined with `bg-gradient-to-br`. */
  gradient: string;
  /** Tailwind background class for the decorative circles. */
  decorColor: string;
}

export const HERO_THEMES: readonly HeroTheme[] = [
  {
    // Same values as the HeroSlide model defaults, so new slides start here.
    id: "fresh",
    label: "Fresh",
    gradient: "from-teal-600 via-emerald-600 to-teal-800",
    decorColor: "bg-emerald-400/20",
  },
  {
    // The FreshBasket brand colour (also used by the coupon slide).
    id: "brand",
    label: "Brand",
    gradient: "from-brand-600 via-brand-700 to-brand-900",
    decorColor: "bg-white/10",
  },
  {
    id: "sunrise",
    label: "Sunrise",
    gradient: "from-orange-500 via-amber-500 to-orange-700",
    decorColor: "bg-amber-300/20",
  },
  {
    id: "citrus",
    label: "Citrus",
    gradient: "from-lime-600 via-green-600 to-green-800",
    decorColor: "bg-lime-300/20",
  },
  {
    id: "berry",
    label: "Berry",
    gradient: "from-rose-600 via-pink-700 to-rose-900",
    decorColor: "bg-pink-300/20",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "from-cyan-600 via-sky-700 to-sky-900",
    decorColor: "bg-cyan-300/20",
  },
  {
    id: "forest",
    label: "Forest",
    gradient: "from-emerald-700 via-green-800 to-slate-900",
    decorColor: "bg-emerald-300/15",
  },
];

/**
 * Returns the preset whose gradient AND decor colour both match the given
 * values, or undefined when the slide uses custom (hand-typed) classes.
 */
export function findHeroTheme(gradient: string, decorColor: string): HeroTheme | undefined {
  // `?? ""` guards against older records that may be missing either field.
  const g = (gradient ?? "").trim();
  const d = (decorColor ?? "").trim();
  return HERO_THEMES.find((theme) => theme.gradient === g && theme.decorColor === d);
}
