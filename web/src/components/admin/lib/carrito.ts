export interface OrderItem {
  Id?: number;
  id_producto?: number;
  nombre?: string;
  precio?: number;
  precio_unitario?: number;
  precio_original?: number;
  cantidad: number;
  cantidad_original?: number;
  tipo?: string;
  quantity_per_bundle?: number;
  Oferta?: string;
  oferta?: string;
  Imagen?: string;
  imagen?: string;
}

/** Normalise the `carrito` column, which may arrive as a JSON string or an array. */
export function parseCarrito(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Unit price actually charged for a line (bundle price or per-unit price). */
export function lineUnitPrice(item: OrderItem): number {
  return Number(item.precio_unitario ?? item.precio ?? 0);
}

/** Total for a single line. */
export function lineTotal(item: OrderItem): number {
  return lineUnitPrice(item) * (item.cantidad || 0);
}

/** Canonical cart subtotal — the ONE formula (was duplicated ~7× with 2 variants). */
export function cartSubtotal(items: OrderItem[]): number {
  return items.reduce((acc, item) => acc + lineTotal(item), 0);
}

/** Stable product id for a line, tolerating web (`Id`) vs manual (`id_producto`) carts. */
export function itemProductId(item: OrderItem): number | undefined {
  return item.Id ?? item.id_producto;
}
