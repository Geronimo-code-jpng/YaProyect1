import { db } from "@/db/client";
import { productos_ids_anteriores } from "@/db/schema";
import { jsonCorsCached } from "@/lib/cors";
import { ventasPorProducto } from "@/lib/ventasPorProducto";

// Ids de producto del más vendido al menos vendido (solo pedidos pagados, ver
// lib/ventasPorProducto). Lo usa el carrito para sugerir. Solo el orden: las
// unidades y la plata quedan para el panel de admin.
export async function GET() {
  const [ventas, anteriores] = await Promise.all([
    ventasPorProducto(),
    db.select().from(productos_ids_anteriores),
  ]);

  // Un pedido viejo puede tener el id de antes de que el sistema lo cambiara
  const idActual = new Map(anteriores.map((a) => [a.id_anterior, a.id_sistema]));
  const unidades = new Map<number, number>();
  for (const v of ventas.values()) {
    let id = Number(v.Id);
    if (!id) continue;
    if (idActual.has(id)) {
      const nuevo = idActual.get(id);
      if (!nuevo) continue; // se ocultó
      id = nuevo;
    }
    unidades.set(id, (unidades.get(id) || 0) + v.unidades);
  }

  const ranking = [...unidades.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  // Cambia despacio: una hora en el CDN alcanza y no recorre los pedidos a cada rato
  return jsonCorsCached(ranking, 3600, 3600);
}
