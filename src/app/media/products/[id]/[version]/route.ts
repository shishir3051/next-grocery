import { NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import { isHttpsUrl, isObjectId } from "@/lib/validation";
import { Product } from "@/models/Product";

const DATA_URL = /^data:(image\/(?:png|jpeg|jpg|webp|gif|avif));base64,(.+)$/;

/**
 * Serves one product photo as a real image file, so lists only send a short URL
 * (see src/lib/productImages.ts). The URL contains a version that changes on every
 * save, which is what makes the long, immutable cache safe.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id } = await params;
  if (!isObjectId(id)) return new NextResponse("Not found", { status: 404 });

  await dbConnect();
  const product = await Product.findById(id)
    .select("imageData images")
    .lean<{ imageData?: string; images?: string[] }>();

  const match = product?.imageData ? DATA_URL.exec(product.imageData) : null;
  if (match) {
    const type = match[1] === "image/jpg" ? "image/jpeg" : match[1];
    return new NextResponse(new Uint8Array(Buffer.from(match[2], "base64")), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Older products may hold an https URL instead of an uploaded file.
  const fallback = [product?.imageData, product?.images?.[0]].find((value) => isHttpsUrl(value));
  if (fallback) return NextResponse.redirect(fallback, 302);

  return new NextResponse("Not found", { status: 404 });
}
