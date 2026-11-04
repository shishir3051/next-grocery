import { NextRequest, NextResponse } from "next/server";
import { Product, Category } from "@/models/Product";
import { getBase64FromUrl } from "@/lib/imageUtils";
import { requireRole } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isHttpsUrl, isObjectId, optionalImage, optionalString, requiredString, slugify, toNumber } from "@/lib/validation";

const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;

async function resolveCategoryId(category: unknown): Promise<string | null> {
  if (isObjectId(category)) {
    return (await Category.exists({ _id: category })) ? category : null;
  }
  const name = requiredString(category, 60);
  if (!name) return null;
  const found = await Category.findOne({ name }).select("_id").lean<{ _id: unknown }>();
  return found ? String(found._id) : null;
}

/**
 * Validates the product fields that are present in the body (all of them when `partial`
 * is false). Only these fields can ever be written: anything else in the body is ignored.
 */
async function parseProduct(body: Record<string, unknown>, partial: boolean) {
  const has = (key: string) => body[key] !== undefined;
  const out: Record<string, unknown> = {};

  if (!partial || has("name")) {
    const name = requiredString(body.name, 120);
    if (!name) return { error: "Product name is required (max 120 characters)" };
    out.name = name;
    out.slug = slugify(name, "product");
  }
  if (!partial || has("price")) {
    const price = toNumber(body.price, { min: 0.01, max: MAX_PRICE });
    if (price === null) return { error: "Price must be a positive number" };
    out.price = price;
  }
  if (has("discountPrice")) {
    // discountPrice is the sale price; empty or 0 means "no discount".
    const raw = body.discountPrice === "" || body.discountPrice === null ? 0 : body.discountPrice;
    const discountPrice = toNumber(raw, { min: 0, max: MAX_PRICE });
    if (discountPrice === null) return { error: "Discount price must be a number" };
    out.discountPrice = discountPrice;
  }
  if (!partial || has("unit")) {
    const unit = requiredString(body.unit, 30);
    if (!unit) return { error: "Unit is required (e.g. 1 kg)" };
    out.unit = unit;
  }
  if (!partial || has("category")) {
    const category = await resolveCategoryId(body.category);
    if (!category) return { error: "Category not found" };
    out.category = category;
  }
  if (has("description")) {
    const description = optionalString(body.description, 2000);
    if (description === null) return { error: "Description is too long (max 2,000 characters)" };
    out.description = description;
  }
  if (!partial || has("stock")) {
    const raw = body.stock === undefined || body.stock === "" ? 0 : body.stock;
    const stock = toNumber(raw, { min: 0, max: MAX_STOCK, integer: true });
    if (stock === null) return { error: "Stock must be a whole number of 0 or more" };
    out.stock = stock;
  }
  for (const flag of ["isOrganic", "isHalal"] as const) {
    if (has(flag)) out[flag] = body[flag] === true;
  }

  // Images: an uploaded data URL / https URL in imageData, or an https URL to download.
  if (has("imageData")) {
    const imageData = optionalImage(body.imageData);
    if (imageData === null) return { error: "Image must be a PNG, JPEG, WebP, GIF or AVIF under 2 MB, or an https URL" };
    out.imageData = imageData;
  }
  if (has("imageUrl") && body.imageUrl) {
    if (!isHttpsUrl(body.imageUrl)) return { error: "Image URL must start with https://" };
    const downloaded = await getBase64FromUrl(body.imageUrl);
    if (!downloaded) return { error: "Could not download that image (https, public host, image type, max 2 MB)" };
    out.imageData = downloaded;
    out.images = [body.imageUrl];
  } else if (has("image")) {
    if (body.image && !isHttpsUrl(body.image)) return { error: "Image URL must start with https://" };
    out.images = body.image ? [body.image] : [];
  }

  const price = (out.price as number | undefined);
  const discountPrice = (out.discountPrice as number | undefined);
  if (price !== undefined && discountPrice !== undefined && discountPrice >= price && discountPrice !== 0) {
    return { error: "Discount price must be lower than the regular price" };
  }

  return { value: out };
}

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const products = await Product.find().populate('category', 'name slug').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ products });
  } catch (error) {
    return serverError(error, "Admin products fetch error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const parsed = await parseProduct(body, false);
    if ("error" in parsed) return badRequest(parsed.error);

    const newProduct = await Product.create(parsed.value);
    return NextResponse.json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A product with this name already exists");
    return serverError(error, "Admin product create error");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body || !isObjectId(body.id)) return badRequest("Product ID required");

    const parsed = await parseProduct(body, true);
    if ("error" in parsed) return badRequest(parsed.error);

    // When only one of price / discountPrice changes, check the pair against the stored value.
    const { price, discountPrice } = parsed.value as { price?: number; discountPrice?: number };
    if ((price === undefined) !== (discountPrice === undefined)) {
      const current = await Product.findById(body.id).select("price discountPrice").lean<{ price: number; discountPrice?: number }>();
      if (!current) return notFound("Product not found");
      const finalPrice = price ?? current.price;
      const finalDiscount = discountPrice ?? current.discountPrice ?? 0;
      if (finalDiscount !== 0 && finalDiscount >= finalPrice) {
        return badRequest("Discount price must be lower than the regular price");
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(body.id, { $set: parsed.value }, { new: true, runValidators: true });
    if (!updatedProduct) return notFound("Product not found");

    return NextResponse.json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A product with this name already exists");
    return serverError(error, "Admin product update error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const id = request.nextUrl.searchParams.get('id');
    if (!isObjectId(id)) return badRequest("ID required");

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return serverError(error, "Admin product delete error");
  }
}
