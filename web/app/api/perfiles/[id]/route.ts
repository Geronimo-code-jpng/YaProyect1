import { eq } from "drizzle-orm";
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
  for (const field of ["nombre", "telefono", "direccion", "tipo_cliente", "rol"] as const) {
    if (field in body) allowed[field] = body[field];
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
