import { desc, eq, or, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

const CREATE_FIELDS = [
  "nombre_cliente",
  "telefono",
  "direccion",
  "metodo_pago",
  "carrito",
  "total",
  "descuento_aplicado",
  "estado",
  "metodo",
  "created_at",
  "expira_en",
  "fuente",
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

  const [created] = await db.insert(pedidos).values(values as any).returning();
  return jsonCors(created);
}

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
      .where(eq(pedidos.user_id, userId))
      .orderBy(desc(pedidos.created_at));
  } else if (nombre || telefono) {
    const conditions = [];
    if (nombre) conditions.push(ilike(pedidos.nombre_cliente, `%${nombre}%`));
    if (telefono) conditions.push(eq(pedidos.telefono, telefono));
    rows = await db
      .select()
      .from(pedidos)
      .where(or(...conditions))
      .orderBy(desc(pedidos.created_at));
  } else {
    return jsonCors([]);
  }

  return jsonCors(rows);
}
