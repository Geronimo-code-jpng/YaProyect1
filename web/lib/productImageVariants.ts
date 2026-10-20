import { put } from "@vercel/blob";
import sharp from "sharp";
import { VARIANT_WIDTHS, variantPath } from "./imageVariants";

const WEBP_QUALITY = 72;
const ONE_YEAR = 60 * 60 * 24 * 365;

// Guarda en Blob las copias chicas que pide lib/imageLoader.ts, al lado de la
// foto original (`pathname`). Nunca agranda: si la original es más chica que un
// ancho, la copia sale del mismo tamaño, pero el archivo siempre existe.
export async function putProductImageVariants(pathname: string, webp: Buffer) {
  await Promise.all(
    VARIANT_WIDTHS.map(async (width) => {
      const resized = await sharp(webp)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      await put(variantPath(pathname, width), resized, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: ONE_YEAR,
      });
    }),
  );
}
