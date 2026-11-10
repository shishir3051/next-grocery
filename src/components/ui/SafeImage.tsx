"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export const PRODUCT_PLACEHOLDER = "/placeholder-product.svg";

/**
 * next/image that falls back to a neutral placeholder when the photo can't be loaded
 * (a deleted stock photo, a host that went away), instead of a broken-image icon.
 */
export default function SafeImage({ src, alt, unoptimized, ...props }: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const wanted = typeof src === "string" && src ? src : PRODUCT_PLACEHOLDER;
  const current = failedSrc === wanted ? PRODUCT_PLACEHOLDER : wanted;

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      unoptimized={current === PRODUCT_PLACEHOLDER || unoptimized}
      onError={() => setFailedSrc(wanted)}
    />
  );
}
