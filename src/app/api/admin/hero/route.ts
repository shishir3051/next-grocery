import { NextRequest, NextResponse } from "next/server";
import { HeroSlide } from "@/models/HeroSlide";
import { requireRole, requireRoleForWrite } from "@/lib/authGuard";
import { badRequest, notFound, readJsonObject, serverError } from "@/lib/http";
import { isHttpsUrl, isObjectId, optionalImage, optionalString, requiredString, toNumber } from "@/lib/validation";

/** Tailwind class lists only (letters, digits and - / : . [ ] # % space). */
const CLASS_LIST = /^[a-z0-9\s\-/:.[\]#%]{0,200}$/i;
/** A category slug or coupon code, or an https link. */
const CTA_TARGET = /^[a-z0-9_-]{1,60}$/i;

/**
 * Validates the slide fields present in the body (title and subtitle are required on
 * create). Only these fields can be written.
 */
function parseSlide(body: Record<string, unknown>, partial: boolean) {
  const has = (key: string) => body[key] !== undefined;
  const out: Record<string, unknown> = {};

  for (const [key, max] of [["title", 120], ["subtitle", 300]] as const) {
    if (!partial || has(key)) {
      const value = requiredString(body[key], max);
      if (!value) return { error: `${key === "title" ? "Title" : "Subtitle"} is required (max ${max} characters)` };
      out[key] = value;
    }
  }
  for (const [key, max] of [["highlight", 80], ["ctaLabel", 40], ["tag", 40], ["emoji", 16]] as const) {
    const value = optionalString(body[key], max);
    if (value === null) return { error: `${key} is too long (max ${max} characters)` };
    if (value !== undefined) out[key] = value;
  }
  for (const key of ["gradient", "accentColor", "decorColor", "tagColor"] as const) {
    const value = optionalString(body[key], 200);
    if (value === null || (value && !CLASS_LIST.test(value))) return { error: `${key} must be a list of CSS classes` };
    if (value !== undefined) out[key] = value;
  }
  if (has("ctaLink")) {
    const link = optionalString(body.ctaLink, 2000);
    if (link === null || (link && !CTA_TARGET.test(link) && !isHttpsUrl(link))) {
      return { error: "Button link must be a category slug, coupon code or https:// URL" };
    }
    out.ctaLink = link || "all";
  }
  if (has("image")) {
    const image = optionalImage(body.image);
    if (image === null) return { error: "Image must be a PNG, JPEG, WebP, GIF or AVIF under 2 MB, or an https URL" };
    out.image = image;
  }
  if (has("isActive")) {
    if (typeof body.isActive !== "boolean") return { error: "Invalid active flag" };
    out.isActive = body.isActive;
  }
  if (has("order")) {
    const order = toNumber(body.order, { min: 0, max: 10_000, integer: true });
    if (order === null) return { error: "Order must be a whole number" };
    out.order = order;
  }
  return { value: out };
}

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const slides = await HeroSlide.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    return serverError(error, "Admin hero fetch error", "Failed to fetch");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();
    const parsed = parseSlide(body, false);
    if ("error" in parsed) return badRequest(parsed.error);

    const slide = await HeroSlide.create(parsed.value);
    return NextResponse.json({ success: true, slide });
  } catch (error) {
    return serverError(error, "Admin hero create error", "Creation failed");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body || !isObjectId(body.id)) return badRequest("Slide ID required");
    const parsed = parseSlide(body, true);
    if ("error" in parsed) return badRequest(parsed.error);

    const slide = await HeroSlide.findByIdAndUpdate(body.id, { $set: parsed.value }, { new: true, runValidators: true });
    if (!slide) return notFound("Slide not found");
    return NextResponse.json({ success: true, slide });
  } catch (error) {
    return serverError(error, "Admin hero update error", "Update failed");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const id = request.nextUrl.searchParams.get("id");
    if (!isObjectId(id)) return badRequest("Slide ID required");

    await HeroSlide.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error, "Admin hero delete error", "Deletion failed");
  }
}
