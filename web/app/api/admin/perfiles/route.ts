import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET() {
  const rows = await db.select().from(perfiles).orderBy(asc(perfiles.nombre));
  const safe = rows.map(({ password: _password, ...rest }) => rest);
  return jsonCors(safe);
}
