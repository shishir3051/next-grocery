import { isImageDataUrl, optionalImage, optionalString, requiredString, slugify } from "@/lib/validation";

/**
 * Validates the news fields present in the body (all required fields on create).
 * Only these fields can be written; the content is stored as plain text and rendered
 * as text (never as HTML).
 */
export function parseNews(body: Record<string, unknown>, partial: boolean) {
  const has = (key: string) => body[key] !== undefined;
  const out: Record<string, unknown> = {};

  const required: [string, number][] = [["title", 200], ["content", 50_000], ["excerpt", 500], ["category", 60], ["readTime", 30]];
  for (const [key, max] of required) {
    if (!partial || has(key)) {
      const value = requiredString(body[key], max);
      if (!value) return { error: `${key} is required (max ${max.toLocaleString()} characters)` };
      out[key] = value;
    }
  }
  if (out.title) out.slug = slugify(out.title as string, "story");

  if (has("imageData") && body.imageData) {
    if (!isImageDataUrl(body.imageData)) return { error: "Image must be a PNG, JPEG, WebP, GIF or AVIF under 2 MB" };
    out.imageData = body.imageData;
    out.image = ""; // an upload replaces any older image link
  } else if (has("image")) {
    const image = optionalImage(body.image);
    if (image === null) return { error: "Image link must be an https URL" };
    out.image = image;
  }

  if (has("isPublished")) {
    if (typeof body.isPublished !== "boolean") return { error: "Invalid publish flag" };
    out.isPublished = body.isPublished;
  }

  const author = optionalString(body.author, 80);
  if (author === null) return { error: "Author name is too long" };
  if (author) out.author = author;

  return { value: out };
}
