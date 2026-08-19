import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(productos)
    .where(eq(productos.Id, Number(id)));
  return jsonCors(row ?? null);
}
