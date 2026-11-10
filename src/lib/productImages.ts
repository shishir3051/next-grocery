import { Product } from "@/models/Product";

/**
 * Product photos uploaded in the admin are stored as base64 data URLs (`imageData`),
 * often hundreds of KB each. Sending them inside product lists made every list
 * response huge, so lists carry a short image URL instead, served (and cached by the
 * browser and CDN) by `src/app/media/products/[id]/[version]/route.ts`.
 *
 * The version changes whenever the product is saved, so an edited photo is never
 * served from a stale cache.
 */
export function productImageUrl(id: unknown, updatedAt?: unknown) {
  const time = updatedAt ? new Date(updatedAt as string).getTime() : NaN;
  const version = Number.isFinite(time) ? time.toString(36) : "1";
  return `/media/products/${String(id)}/${version}`;
}

type WithId = { _id: unknown; updatedAt?: unknown };

/**
 * For products loaded WITHOUT `imageData` (`.select("-imageData")`): sets `imageData`
 * to the image URL on the products that have an uploaded photo. Existing components
 * keep working, because they only use `imageData` as an image `src`.
 */
export async function withImageUrls<T extends WithId>(products: T[]): Promise<(T & { imageData?: string })[]> {
  if (products.length === 0) return products;
  const withPhoto = await Product.find({
    _id: { $in: products.map((product) => product._id) },
    imageData: { $type: "string", $gt: "" },
  })
    .select("_id")
    .lean<{ _id: unknown }[]>();
  const ids = new Set(withPhoto.map((product) => String(product._id)));

  return products.map((product) =>
    ids.has(String(product._id)) ? { ...product, imageData: productImageUrl(product._id, product.updatedAt) } : product,
  );
}
