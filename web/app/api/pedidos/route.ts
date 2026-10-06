import { and, desc, eq, or, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// created_at lo pone la DB (defaultNow) — nunca el cliente: el reloj del
// dispositivo puede estar desfasado y el pedido aparecería fuera de orden en el
// panel.
//
// "estado" y "fuente" NO vienen del navegador: los fija el servidor. Antes los
// mandaba el cliente y cualquiera podía crear un pedido ya "pagado". Un pedido
// nuevo siempre arranca "pendiente" y de la fuente "web"; de ahí en adelante lo
// maneja el sistema del negocio, que lo lee desde esta base.
const CREATE_FIELDS = [
  "nombre_cliente",
  "telefono",
  "direccion",
  "metodo_pago",
  "carrito",
  "total",
  "descuento_aplicado",
  "metodo",
  "horario",
  "notas",
  "user_id",
] as const;

export async function POST(request: Request) {
  const body = await request.json();

  const values: Record<string, unknown> = {};
  for (const field of CREATE_FIELDS) {
    if (field in body) values[field] = body[field];
  }

  values.estado = "pendiente";
  values.fuente = "web";

  const [created] = await db.insert(pedidos).values(values as any).returning();
  return jsonCors(created);
}

// La tienda solo muestra los pedidos que se hicieron en la tienda (fuente "web").
// Los que nacen en el sistema del negocio (mostrador, facturas) no se ven acá.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const nombre = url.searchParams.get("nombre");
  const telefono = url.searchParams.get("telefono");

  let rows;
  if (userId) {
    rows = await db
      .select()
      .from(pedidos)
      .where(and(eq(pedidos.fuente, "web"), eq(pedidos.user_id, userId)))
      .orderBy(desc(pedidos.created_at));
  } else if (nombre || telefono) {
    const conditions = [];
    if (nombre) conditions.push(ilike(pedidos.nombre_cliente, `%${nombre}%`));
    if (telefono) conditions.push(eq(pedidos.telefono, telefono));
    rows = await db
      .select()
      .from(pedidos)
      .where(and(eq(pedidos.fuente, "web"), or(...conditions)))
      .orderBy(desc(pedidos.created_at));
  } else {
    return jsonCors([]);
  }

  return jsonCors(rows);
}
