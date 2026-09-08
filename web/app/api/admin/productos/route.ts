import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { ventasPorProducto } from "@/lib/ventasPorProducto";

// Catálogo para el panel: cada producto llega con las unidades e ingresos
// reales acumulados de los pedidos pagados. El filtro/orden "Más vendido" del
// admin se calcula con esto, no con el flag manual `mas_vendido`.
export async function GET() {
  const [rows, ventas] = await Promise.all([
    db.select().from(productos),
    ventasPorProducto(),
  ]);

  const enriched = rows.map((p) => {
    const v = ventas.get(String(p.Id));
    return {
      ...p,
      unidades_vendidas: v?.unidades ?? 0,
      ingresos_generados: v?.ingresos ?? 0,
    };
  });

  return jsonCors(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();

  const values = {
    Id: Date.now(),
    nombre: body.nombre,
    precio: body.precio,
    Categoria: body.Categoria,
    Oferta: body.Oferta || null,
    Stock: Boolean(body.Stock),
    quantity: body.quantity || 1,
    oferta_express: Boolean(body.oferta_express),
    mas_vendido: Boolean(body.mas_vendido),
    solo_bulto: Boolean(body.solo_bulto),
    Imagen: body.Imagen || null,
  };

  const [created] = await db.insert(productos).values(values).returning();
  return jsonCors(created);
}
