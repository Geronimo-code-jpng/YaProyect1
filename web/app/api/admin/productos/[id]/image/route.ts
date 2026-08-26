import { put } from "@vercel/blob";
import { jsonCors } from "@/lib/cors";

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

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const pathname = `product-images/producto${id}.${extension}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return jsonCors({ success: true, imageUrl: blob.url });
}
