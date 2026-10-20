import { del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { jsonCors } from "@/lib/cors";
import { MAX_WIDTH, isVariantPath } from "@/lib/imageVariants";
import { putProductImageVariants } from "@/lib/productImageVariants";

// sharp necesita el runtime de Node (no Edge).
export const runtime = "nodejs";

// Las fotos que suben los admins (celular, 1-5 MB) se redimensionan a
// MAX_WIDTH y se pasan a WebP antes de guardar en Blob, para que el egreso de
// datos sea mínimo.
const WEBP_QUALITY = 72;
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return jsonCors({ success: false, error: "No se envió ningún archivo" });
  }

  if (!file.type.startsWith("image/")) {
    return jsonCors({ success: false, error: "El archivo no es una imagen" });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let optimized: Buffer;
  try {
    optimized = await sharp(inputBuffer)
      .rotate() // respeta la orientación EXIF
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return jsonCors({
      success: false,
      error: "No se pudo procesar la imagen",
    });
  }

  const pathname = `product-images/producto${id}.webp`;

  const blob = await put(pathname, optimized, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: ONE_YEAR,
  });
  // Copias chicas para listados y miniaturas (las elige lib/imageLoader.ts).
  await putProductImageVariants(pathname, optimized);

  // Borra blobs viejos de este producto con otra extensión (.png/.jpg) para no
  // dejar archivos grandes huérfanos consumiendo almacenamiento.
  try {
    const { blobs } = await list({ prefix: `product-images/producto${id}.` });
    const stale = blobs
      .filter((b) => b.pathname !== pathname && !isVariantPath(b.pathname))
      .map((b) => b.url);
    if (stale.length) await del(stale);
  } catch {
    // limpieza best-effort; no bloquea la respuesta
  }

  return jsonCors({ success: true, imageUrl: blob.url });
}
