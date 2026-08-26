import { NextResponse } from "next/server";

// Endpoints de solo lectura, sin credenciales: mismo catálogo que ya era
// público vía la anon key de Supabase. CORS abierto para que el SPA (en otro
// origin durante la transición) pueda consumirlos.
export function jsonCors(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
