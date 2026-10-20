/**
 * Genera las copias WebP (anchos de STATIC_WIDTHS) de fotos grandes de /public
 * en public/optimized/, para servirlas sin el optimizador de Vercel. Las copias
 * se suben al repo: correrlo de nuevo solo si cambia o se agrega una foto.
 *
 * Uso (desde web/):
 *   npx tsx scripts/resize-static-images.mts public/Carrusel{1,2,3,4}{,-mobile}.png
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { STATIC_WIDTHS, staticVariantPath } from "../lib/imageVariants";

const WEBP_QUALITY = 78;

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Pasá las fotos a procesar, ej: public/Carrusel1.png");
  process.exit(1);
}

mkdirSync("public/optimized", { recursive: true });
for (const file of files) {
  for (const width of STATIC_WIDTHS) {
    const out = `public${staticVariantPath(file, width)}`;
    const { size } = await sharp(file)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(out);
    console.log(`  ${out}: ${(size / 1024).toFixed(0)} KB`);
  }
}
