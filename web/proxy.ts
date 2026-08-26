import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// API de solo catálogo/pedidos, sin cookies/credenciales: CORS abierto para
// que el SPA (en otro origin durante la transición) pueda consumirla,
// incluyendo el preflight OPTIONS que dispara cualquier fetch con
// Content-Type: application/json.
export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
