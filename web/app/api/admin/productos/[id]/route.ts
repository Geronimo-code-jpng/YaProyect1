import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

const UPDATE_FIELDS = [
  "nombre",
  "precio",
  "Categoria",
  "Oferta",
  "Stock",
  "quantity",
  "oferta_express",
  "mas_vendido",
  "solo_bulto",
  "Imagen",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const values: Record<string, unknown> = {};
  for (const field of UPDATE_FIELDS) {
    if (field in body) values[field] = body[field];
  }

  const [updated] = await db
    .update(productos)
    .set(values)
    .where(eq(productos.Id, Number(id)))
    .returning();

  return jsonCors(updated ?? null);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(productos).where(eq(productos.Id, Number(id)));
  return jsonCors({ success: true });
}
