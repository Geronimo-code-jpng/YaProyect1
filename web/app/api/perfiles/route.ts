import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return jsonCors(null);

  const [row] = await db.select().from(perfiles).where(eq(perfiles.email, email));
  if (!row) return jsonCors(null);

  const { password: _password, ...safe } = row;
  return jsonCors(safe);
}
