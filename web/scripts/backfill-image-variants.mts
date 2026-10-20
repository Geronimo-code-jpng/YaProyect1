/**
 * Migración única: crea las copias chicas (VARIANT_WIDTHS de lib/imageVariants.ts)
 * de las fotos de producto que se subieron antes de que la subida las generara.
 * Se puede correr más de una vez: saltea las fotos que ya tienen todas sus copias.
 *
 * Uso (desde web/):
 *   npx tsx --env-file=.env.local scripts/backfill-image-variants.mts --dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-image-variants.mts
 */
import { list } from "@vercel/blob";
import { VARIANT_WIDTHS, isVariantPath, variantPath } from "../lib/imageVariants";
import { putProductImageVariants } from "../lib/productImageVariants";

const DRY_RUN = process.argv.includes("--dry-run");
const PREFIX = "product-images/";

const all: { pathname: string; url: string }[] = [];
let cursor: string | undefined;
do {
  const res = await list({ prefix: PREFIX, cursor, limit: 1000 });
  all.push(...res.blobs);
  cursor = res.cursor;
} while (cursor);

const existing = new Set(all.map((b) => b.pathname));
const pending = all.filter(
  (b) =>
    b.pathname.endsWith(".webp") &&
    !isVariantPath(b.pathname) &&
    VARIANT_WIDTHS.some((w) => !existing.has(variantPath(b.pathname, w))),
);
console.log(`${pending.length} de ${all.length} blobs necesitan copias`);

let failed = 0;
for (const blob of DRY_RUN ? [] : pending) {
  try {
    const resp = await fetch(blob.url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    await putProductImageVariants(blob.pathname, Buffer.from(await resp.arrayBuffer()));
    console.log(`  ok  ${blob.pathname}`);
  } catch (err) {
    failed++;
    console.error(`  ERR ${blob.pathname}: ${err}`);
  }
}
console.log(DRY_RUN ? "Dry run: no se escribió nada." : `Listo: ${pending.length - failed} ok, ${failed} con error.`);
if (failed) process.exitCode = 1;
