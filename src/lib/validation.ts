import { randomBytes } from "crypto";

/**
 * Input validation helpers for API routes.
 *
 * Rule: a route copies only the fields it expects, each checked for type and size.
 * Never spread a request body into a database write (mass assignment), and never pass
 * a non-string value into a Mongo filter (NoSQL operator injection like { "$ne": null }).
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lower-cased, trimmed email, or null if it isn't a plausible address. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

/** 24-hex-character MongoDB ObjectId string. */
export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

/** Trimmed string of 1..max characters, or null. */
export function requiredString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

/**
 * Trimmed string of 0..max characters. Returns undefined when the field is absent
 * (so partial updates can skip it) and null when it is present but invalid.
 */
export function optionalString(value: unknown, max: number): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return "";
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= max ? text : null;
}

/** Finite number within [min, max] (accepts numeric strings from form inputs), or null. */
export function toNumber(value: unknown, { min, max, integer = false }: { min: number; max: number; integer?: boolean }): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  if (integer && !Number.isInteger(n)) return null;
  return n;
}

/** Valid date (from an ISO string or timestamp), or null. */
export function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Escapes a string for literal use inside a RegExp / Mongo $regex. */
export const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Uploaded images are stored as data URLs. ~2 MB of binary is ~2.7 M base64 characters. */
export const MAX_IMAGE_DATA_URL_CHARS = 2_800_000;
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/]+=*$/i;

/** https URL (no credentials) of at most 2,000 characters. */
export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** A base64 image data URL of an allowed type and size. SVG is excluded (it can carry script). */
export function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_IMAGE_DATA_URL_CHARS && DATA_URL_PATTERN.test(value);
}

/** A same-origin path such as /images/apple.jpg (not the protocol-relative //host form). */
const isSameOriginPath = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 500 && /^\/[^/\\]/.test(value);

/**
 * An image field: an uploaded data URL, an https URL, a same-origin path, or empty.
 * Returns undefined when absent, null when invalid.
 */
export function optionalImage(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null || value === "") return "";
  if (isImageDataUrl(value) || isHttpsUrl(value) || isSameOriginPath(value)) return value;
  return null;
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

/**
 * URL slug from a name. Names with no Latin letters or digits (e.g. Bangla) would give
 * an empty slug and collide on the unique index, so they get a short random suffix instead.
 */
export function slugify(name: string, fallbackPrefix = "item"): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return slug || `${fallbackPrefix}-${randomBytes(3).toString("hex")}`;
}
