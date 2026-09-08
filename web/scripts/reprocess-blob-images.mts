/**
 * Migración única: comprime y pasa a WebP todas las imágenes de producto que
 * ya están en Vercel Blob, y actualiza la columna `Imagen` en Neon con las
 * nuevas URLs .webp. Al final borra los blobs viejos (.png/.jpg) ya reemplazados.
 *
 * Uso (desde web/):
 *   npx tsx scripts/reprocess-blob-images.mts --dry-run
 *   npx tsx scripts/reprocess-blob-images.mts
 *
 * Toma las credenciales de .env.local o .env automáticamente (las que baja
 * `vercel env pull`). No hace falta exportarlas a mano.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { del, list, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { productos } from "../db/schema";

// ─── Cargar .env.local / .env sin depender del shell ──────────────────────────
function loadEnvFile(file: string) {
  let text: string;
  try {
    text = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!DB_URL) {
  console.error(
    "Falta DATABASE_URL. Corré `vercel env pull .env.local` en web/ y volvé a intentar.",
  );
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "Falta BLOB_READ_WRITE_TOKEN. Corré `vercel env pull .env.local` en web/ y volvé a intentar.",
  );
  process.exit(1);
}

const db = drizzle(neon(DB_URL));

const DRY_RUN = process.argv.includes("--dry-run");
const PREFIX = "product-images/";
const MAX_WIDTH = 900;
const WEBP_QUALITY = 72;
const ONE_YEAR = 60 * 60 * 24 * 365;

function webpPathname(pathname: string): string {
  return pathname.replace(/\.[^./]+$/, "") + ".webp";
}

async function main() {
  console.log(DRY_RUN ? "== DRY RUN ==" : "== APLICANDO CAMBIOS ==");

  // 1. Juntar todos los blobs bajo product-images/
  const all: { pathname: string; url: string; size: number }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix: PREFIX, cursor, limit: 1000 });
    all.push(...res.blobs.map((b) => ({ pathname: b.pathname, url: b.url, size: b.size })));
    cursor = res.cursor;
  } while (cursor);

  console.log(`Blobs encontrados: ${all.length}`);

  const remap: { oldUrl: string; newUrl: string }[] = [];
  let bytesBefore = 0;
  let bytesAfter = 0;

  // 2. Recomprimir cada blob que no sea ya .webp
  for (const blob of all) {
    if (blob.pathname.endsWith(".webp")) continue;

    const targetPath = webpPathname(blob.pathname);
    bytesBefore += blob.size;

    const resp = await fetch(blob.url);
    if (!resp.ok) {
      console.warn(`  ! no se pudo bajar ${blob.pathname} (${resp.status})`);
      continue;
    }
    const input = Buffer.from(await resp.arrayBuffer());

    let optimized: Buffer;
    try {
      optimized = await sharp(input)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (err) {
      console.warn(`  ! sharp falló en ${blob.pathname}:`, err);
      continue;
    }
    bytesAfter += optimized.length;

    const kbOld = (blob.size / 1024).toFixed(0);
    const kbNew = (optimized.length / 1024).toFixed(0);
    console.log(`  ${blob.pathname}: ${kbOld} KB -> ${targetPath}: ${kbNew} KB`);

    if (DRY_RUN) {
      remap.push({ oldUrl: blob.url, newUrl: blob.url.replace(blob.pathname, targetPath) });
      continue;
    }

    const putres = await put(targetPath, optimized, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: ONE_YEAR,
    });
    remap.push({ oldUrl: blob.url, newUrl: putres.url });
  }

  console.log(
    `\nTotal: ${(bytesBefore / 1024 / 1024).toFixed(1)} MB -> ${(bytesAfter / 1024 / 1024).toFixed(1)} MB`,
  );

  // 3. Actualizar la DB
  let updated = 0;
  for (const { oldUrl, newUrl } of remap) {
    if (oldUrl === newUrl) continue;
    if (DRY_RUN) {
      console.log(`  DB: Imagen ${oldUrl} -> ${newUrl}`);
      continue;
    }
    const rows = await db
      .update(productos)
      .set({ Imagen: newUrl })
      .where(eq(productos.Imagen, oldUrl))
      .returning({ Id: productos.Id });
    updated += rows.length;
  }
  console.log(`\nFilas de productos actualizadas: ${DRY_RUN ? "(dry run)" : updated}`);

  // 4. Borrar los blobs viejos ya reemplazados
  const stale = remap.filter((r) => r.oldUrl !== r.newUrl).map((r) => r.oldUrl);
  if (stale.length && !DRY_RUN) {
    await del(stale);
    console.log(`Blobs viejos borrados: ${stale.length}`);
  } else if (stale.length) {
    console.log(`Blobs viejos a borrar: ${stale.length} (dry run)`);
  }

  console.log("\nListo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
