"use client";

import type { ImageLoaderProps } from "next/image";
import { VARIANT_WIDTHS, variantPath } from "./imageVariants";

function isBlobWebp(src: string) {
  return /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/.+\.webp$/.test(src);
}

// Reemplaza al optimizador de imágenes de Vercel: las fotos de producto se
// guardan ya achicadas a anchos fijos (ver lib/productImageVariants.ts), así
// que acá solo se elige la copia más chica que cubra el ancho pedido. Lo demás
// (placeholders y fotos de /public) se sirve tal cual.
export default function imageLoader({ src, width }: ImageLoaderProps) {
  if (!isBlobWebp(src)) return src;
  const variant = VARIANT_WIDTHS.find((w) => w >= width);
  return variant ? variantPath(src, variant) : src;
}
