import { NextResponse } from "next/server";

// Endpoints de solo lectura, sin credenciales: mismo catálogo que ya era
// público vía la anon key de Supabase. CORS abierto para que el SPA (en otro
// origin durante la transición) pueda consumirlos.
export function jsonCors(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

// Igual que jsonCors pero además deja que el CDN de Vercel cachee la respuesta.
// Pensado para catálogo/categorías (lectura pública que cambia poco):
//   - s-maxage=300      -> el CDN sirve la misma respuesta hasta 5 min sin
//                          volver a ejecutar la función ni tocar la DB.
//   - stale-while-revalidate=600 -> tras esos 5 min sigue sirviendo la copia
//                          vieja hasta 10 min más mientras revalida en segundo
//                          plano, así nadie espera.
// Al editar un producto en el admin, los cambios pueden tardar hasta ~5 min en
// verse en el catálogo público. Si hace falta que sea inmediato, bajar s-maxage.
export function jsonCorsCached(data: unknown, sMaxAge = 300, swr = 600) {
  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
      "CDN-Cache-Control": `public, s-maxage=${sMaxAge}`,
    },
  });
}
