import { NextResponse } from "next/server";

// Endpoints de solo lectura, sin credenciales: mismo catálogo que ya era
// público vía la anon key de Supabase. CORS abierto para que el SPA (en otro
// origin durante la transición) pueda consumirlos.
export function jsonCors(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

// Igual que jsonCors pero además deja que el CDN de Vercel cachee la respuesta.
// Pensado para catálogo/categorías (lectura pública):
//   - s-maxage=60       -> el CDN sirve la misma respuesta hasta 1 min sin
//                          volver a ejecutar la función ni tocar la DB.
//   - stale-while-revalidate=120 -> tras ese minuto sigue sirviendo la copia
//                          vieja hasta 2 min más mientras revalida en segundo
//                          plano, así nadie espera.
// El STOCK del catálogo lo manda el sistema del negocio y cambia con cada
// venta, así que el caché es corto a propósito: con los 5+10 minutos de antes
// la tienda podía mostrar stock con hasta 15 minutos de atraso. Con esto, y el
// minuto que guarda el navegador (ProductContext), el atraso máximo es ~2 min.
export function jsonCorsCached(data: unknown, sMaxAge = 60, swr = 120) {
  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
      "CDN-Cache-Control": `public, s-maxage=${sMaxAge}`,
    },
  });
}
