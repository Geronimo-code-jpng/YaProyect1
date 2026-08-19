import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { configuracion } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET() {
  const [row] = await db.select().from(configuracion).where(eq(configuracion.id, 1));
  return jsonCors(row ?? null);
}

const UPDATE_FIELDS = ["precio_envio", "banco", "titular", "alias", "cbu"] as const;

export async function PATCH(request: Request) {
  const body = await request.json();

  const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of UPDATE_FIELDS) {
    if (field in body) values[field] = body[field];
  }

  const [updated] = await db
    .update(configuracion)
    .set(values)
    .where(eq(configuracion.id, 1))
    .returning();

  return jsonCors(updated ?? null);
}
