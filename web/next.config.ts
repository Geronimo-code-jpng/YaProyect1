import type { NextConfig } from "next";
import { MAX_WIDTH, VARIANT_WIDTHS } from "./lib/imageVariants";

const nextConfig: NextConfig = {
  images: {
    // Sin el optimizador de Vercel: las fotos de producto se guardan en Blob ya
    // achicadas y el loader solo elige la copia que corresponde.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    // Los candidatos del srcset son exactamente los anchos que existen en Blob,
    // así ninguno se repite.
    imageSizes: [VARIANT_WIDTHS[0]],
    deviceSizes: [...VARIANT_WIDTHS.slice(1), MAX_WIDTH],
  },
};

export default nextConfig;
