import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors, jsonCorsCached } from "@/lib/cors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(productos)
    .where(and(eq(productos.Id, Number(id)), eq(productos.publicado, true)));
  // Un producto que no existe o no está publicado es un 404 (no se cachea)
  if (!row) return jsonCors({ error: "Producto no encontrado" }, 404);
  return jsonCorsCached(row);
}
