import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db.select().from(perfiles).where(eq(perfiles.id, id));
  if (!row) return jsonCors(null);
  const { password: _password, ...safe } = row;
  return jsonCors(safe);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const allowed: Record<string, unknown> = {};
  for (const field of ["nombre", "telefono", "direccion", "tipo_cliente", "rol", "referencia"] as const) {
    if (field in body) allowed[field] = body[field];
  }
  // El punto del mapa va junto con la dirección. Si se reescribe la dirección
  // sin mandar punto, el viejo ya no corresponde y se borra (el próximo pedido
  // la pide confirmar en el mapa); si viene igual que antes, se conserva.
  if ("lat" in body || "lon" in body) {
    const lat = Number(body.lat);
    const lon = Number(body.lon);
    const ok = body.lat != null && body.lon != null && Number.isFinite(lat) && Number.isFinite(lon);
    allowed.lat = ok ? lat : null;
    allowed.lon = ok ? lon : null;
  } else if ("direccion" in body) {
    const misma = sql`${perfiles.direccion} IS NOT DISTINCT FROM ${body.direccion ?? null}`;
    allowed.lat = sql`CASE WHEN ${misma} THEN ${perfiles.lat} END`;
    allowed.lon = sql`CASE WHEN ${misma} THEN ${perfiles.lon} END`;
  }

  const [updated] = await db
    .update(perfiles)
    .set(allowed)
    .where(eq(perfiles.id, id))
    .returning();

  if (!updated) return jsonCors(null);
  const { password: _password, ...safe } = updated;
  return jsonCors(safe);
}
