import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { ventasPorProducto } from "@/lib/ventasPorProducto";

// Catálogo para el panel: cada producto llega con las unidades e ingresos
// reales acumulados de los pedidos pagados. El filtro/orden "Más vendido" del
// admin se calcula con esto, no con el flag manual `mas_vendido`.
//
// Acá llegan TODOS los productos, también los que están sin publicar: el
// panel los muestra para poder ponerles foto antes de que salgan. No hay
// alta de productos desde la página: el catálogo lo maneja el sistema del
// negocio (deposito-ia), que crea y actualiza los productos solo.
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
