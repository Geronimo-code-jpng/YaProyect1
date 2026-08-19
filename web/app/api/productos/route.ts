import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET() {
  const rows = await db.select().from(productos);
  return jsonCors(rows);
}
