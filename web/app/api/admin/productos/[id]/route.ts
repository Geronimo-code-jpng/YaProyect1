import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Lo único que se edita desde la página. Todo lo demás (nombre, precio, rubro,
// stock, unidades) lo maneja el sistema del negocio y se pisaría en el próximo
// envío, así que ni se acepta: la foto, "más vendido", "oferta express" y el
// precio tachado (Oferta) son de la tienda.
//
// No hay alta ni baja de productos desde acá: los crea y los da de baja el
// sistema (un producto dado de baja queda con publicado = false, nunca se borra).
const UPDATE_FIELDS = ["Imagen", "mas_vendido", "oferta_express", "Oferta"] as const;

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
  if (Object.keys(values).length === 0) {
    return jsonCors(
      { error: "Solo se puede editar la foto, más vendido, oferta express y el precio tachado" },
      400,
    );
  }

  const [updated] = await db
    .update(productos)
    .set(values)
    .where(eq(productos.Id, Number(id)))
    .returning();

  return jsonCors(updated ?? null);
}
