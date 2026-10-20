// Compartido por la subida de imágenes, el loader de next/image, next.config.ts
// y los scripts: no puede importar sharp ni nada que sea solo de servidor.

// Ancho máximo que realmente se muestra en la tienda (la foto "original").
export const MAX_WIDTH = 900;

// Copias más chicas que se guardan en Blob al lado de cada foto de producto.
// Junto con la original son los únicos anchos que pide next/image (ver
// next.config.ts), así cada candidato del srcset es un archivo que existe.
export const VARIANT_WIDTHS = [256, 512];

// product-images/producto12.webp -> product-images/producto12.w256.webp
// Sirve igual para el pathname de Blob y para la URL completa.
export function variantPath(path: string, width: number) {
  return path.replace(/\.webp$/, `.w${width}.webp`);
}

export function isVariantPath(path: string) {
  return /\.w\d+\.webp$/.test(path);
}

// Fotos grandes de /public (el carrusel): scripts/resize-static-images.mts
// genera estas copias en public/optimized/ y se suben al repo.
export const STATIC_WIDTHS = [640, 1080, 1920, 2560];

// /Carrusel1.png -> /optimized/Carrusel1.w1080.webp
export function staticVariantPath(src: string, width: number) {
  const name = src.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
  return `/optimized/${name}.w${width}.webp`;
}

export function staticSrcSet(src: string) {
  return STATIC_WIDTHS.map((w) => `${staticVariantPath(src, w)} ${w}w`).join(", ");
}
