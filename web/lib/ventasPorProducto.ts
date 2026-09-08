import { db } from "@/db/client";
import { pedidos } from "@/db/schema";

// Estados que cuentan como venta concretada / ingreso real.
// Debe coincidir con app/api/admin/clientes/route.ts.
export const ESTADOS_PAGADOS = new Set(["pagado"]);

type CartItem = {
  Id?: number | string;
  nombre?: string;
  cantidad?: number;
  precio?: number;
  precio_unitario?: number;
  subtotal?: number;
};

export type VentaProducto = {
  Id: number | string | null;
  nombre: string;
  unidades: number;
  ingresos: number;
};

type PedidoVenta = { estado: string | null; carrito: unknown };

function parseCarrito(raw: unknown): CartItem[] {
  if (Array.isArray(raw)) return raw as CartItem[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function itemUnit(it: CartItem): number {
  return Number(it.precio_unitario ?? it.precio ?? 0) || 0;
}

/**
 * Unidades e ingresos por producto, sumando SOLO los pedidos pagados.
 * La clave del Map es String(Id) (o el nombre si el ítem no trae Id).
 *
 * Única fuente de verdad para "más vendido": la usan tanto la analítica de
 * clientes (`/api/admin/clientes`) como el panel de productos
 * (`/api/admin/productos`), así ambas secciones muestran el mismo ranking.
 */
export function acumularVentas(
  pedidosRows: readonly PedidoVenta[],
): Map<string, VentaProducto> {
  const map = new Map<string, VentaProducto>();
  for (const ped of pedidosRows) {
    if (!ESTADOS_PAGADOS.has(ped.estado || "")) continue;
    for (const it of parseCarrito(ped.carrito)) {
      const cantidad = Number(it.cantidad) || 0;
      if (cantidad <= 0) continue;
      const precio = itemUnit(it);
      const subtotal = Number(it.subtotal ?? precio * cantidad) || 0;
      const k = String(it.Id ?? it.nombre ?? "");
      if (!k) continue;
      const cur =
        map.get(k) ||
        ({
          Id: it.Id ?? null,
          nombre: it.nombre || "Producto",
          unidades: 0,
          ingresos: 0,
        } as VentaProducto);
      cur.unidades += cantidad;
      cur.ingresos += subtotal;
      map.set(k, cur);
    }
  }
  return map;
}

/** Igual que {@link acumularVentas} pero leyendo los pedidos de la DB. */
export async function ventasPorProducto(): Promise<Map<string, VentaProducto>> {
  const rows = await db
    .select({ estado: pedidos.estado, carrito: pedidos.carrito })
    .from(pedidos);
  return acumularVentas(rows);
}
