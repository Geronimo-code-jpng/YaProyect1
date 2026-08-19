import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categorias } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(categorias).where(eq(categorias.id, id));
  return jsonCors({ success: true });
}
