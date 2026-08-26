import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

const UPDATE_FIELDS = [
  "estado",
  "expira_en",
  "horario",
  "notas",
  "pagado_manualmente",
  "fecha_pago",
  "modificado_por",
  "fecha_modificacion",
  "carrito",
  "total",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db.select().from(pedidos).where(eq(pedidos.id, Number(id)));
  return jsonCors(row ?? null);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const ifEstado = new URL(request.url).searchParams.get("if_estado");

  const values: Record<string, unknown> = {};
  for (const field of UPDATE_FIELDS) {
    if (field in body) values[field] = body[field];
  }

  const condition = ifEstado
    ? and(eq(pedidos.id, Number(id)), eq(pedidos.estado, ifEstado))
    : eq(pedidos.id, Number(id));

  const [updated] = await db.update(pedidos).set(values).where(condition).returning();

  return jsonCors(updated ?? null);
}
