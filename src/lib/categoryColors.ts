/**
 * Soft "aisle" tints that give each category its own colour, like the signs in a
 * greengrocer. Classes are written out literally so Tailwind v4 generates them.
 * Used only for decoration (icon tiles, heading markers), never for text meaning.
 */
const TINTS = [
  { tile: "bg-lime-100 ring-lime-200", marker: "bg-lime-500" },
  { tile: "bg-orange-100 ring-orange-200", marker: "bg-orange-500" },
  { tile: "bg-sky-100 ring-sky-200", marker: "bg-sky-500" },
  { tile: "bg-rose-100 ring-rose-200", marker: "bg-rose-500" },
  { tile: "bg-amber-100 ring-amber-200", marker: "bg-amber-500" },
  { tile: "bg-violet-100 ring-violet-200", marker: "bg-violet-500" },
  { tile: "bg-teal-100 ring-teal-200", marker: "bg-teal-500" },
  { tile: "bg-pink-100 ring-pink-200", marker: "bg-pink-500" },
] as const;

export type CategoryTint = (typeof TINTS)[number];

/** Same name always gets the same tint, so a category looks the same everywhere. */
export function getCategoryTint(name: string): CategoryTint {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}
