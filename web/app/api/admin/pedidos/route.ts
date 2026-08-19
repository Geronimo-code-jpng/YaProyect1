import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET() {
  const rows = await db.select().from(pedidos).orderBy(desc(pedidos.created_at));
  return jsonCors(rows);
}
