import { supabase } from "../lib/supabase";

export interface CartValidationItem {
  Id: number;
  nombre: string;
  precio: number;
  Stock: boolean;
  Oferta?: string;
  cantidad: number;
  tipo: string;
  quantity_per_bundle: number;
  imagen?: string;
}

export interface PriceChange {
  Id: number;
  nombre: string;
  tipo: string;
  cambios: {
    campo: "precio" | "stock" | "oferta" | "existencia";
    valorViejo: string | number | boolean;
    valorNuevo: string | number | boolean;
  }[];
}

export interface ValidationResult {
  hasChanges: boolean;
  changes: PriceChange[];
  dbProducts: Record<
    number,
    {
      Id: number;
      nombre: string;
      precio: number;
      Stock: boolean;
      Oferta?: string;
      quantity: number;
      Imagen?: string;
      Categoria?: string;
    }
  >;
}

export async function validateCartItems(
  cart: CartValidationItem[],
): Promise<ValidationResult> {
  if (cart.length === 0) {
    return { hasChanges: false, changes: [], dbProducts: {} };
  }

  const ids = cart.map((item) => item.Id);

  const { data: dbProducts, error } = await supabase
    .from("productos")
    .select("Id, nombre, precio, Stock, Oferta, quantity, Imagen, Categoria")
    .in("Id", ids);

  if (error) throw error;

  const dbMap: Record<number, any> = {};
  for (const p of dbProducts || []) {
    dbMap[p.Id] = p;
  }

  const changes: PriceChange[] = [];

  for (const item of cart) {
    const db = dbMap[item.Id];

    if (!db) {
      changes.push({
        Id: item.Id,
        nombre: item.nombre,
        tipo: item.tipo,
        cambios: [
          {
            campo: "existencia",
            valorViejo: "Disponible",
            valorNuevo: "Ya no existe",
          },
        ],
      });
      continue;
    }

    const itemChanges: PriceChange["cambios"] = [];

    if (!db.Stock) {
      itemChanges.push({
        campo: "stock",
        valorViejo: "Disponible",
        valorNuevo: "Sin stock",
      });
    }

    const quantityPerBundle = db.quantity || 1;
    const dbBundlePrice = Number(db.precio);
    const dbUnitPrice =
      Math.ceil(((dbBundlePrice / quantityPerBundle) * 1.2) / 10) * 10;
    const currentPrice = item.tipo === "Bulto" ? dbBundlePrice : dbUnitPrice;

    if (currentPrice !== item.precio) {
      itemChanges.push({
        campo: "precio",
        valorViejo: `$${item.precio.toLocaleString("es-AR")}`,
        valorNuevo: `$${currentPrice.toLocaleString("es-AR")}`,
      });
    }

    if (itemChanges.length > 0) {
      changes.push({
        Id: item.Id,
        nombre: item.nombre,
        tipo: item.tipo,
        cambios: itemChanges,
      });
    }
  }

  return { hasChanges: changes.length > 0, changes, dbProducts: dbMap };
}

export function computeUpdatedCart(
  cart: CartValidationItem[],
  dbProducts: Record<number, any>,
): CartValidationItem[] {
  return cart.map((item) => {
    const db = dbProducts[item.Id];
    if (!db) return item;

    if (!db.Stock) {
      return { ...item, cantidad: 0, Stock: false };
    }

    const quantityPerBundle = db.quantity || 1;
    const dbBundlePrice = Number(db.precio);
    const dbUnitPrice =
      Math.ceil(((dbBundlePrice / quantityPerBundle) * 1.2) / 10) * 10;
    const finalPrice = item.tipo === "Bulto" ? dbBundlePrice : dbUnitPrice;

    return {
      ...item,
      precio: finalPrice,
      precio_unitario: finalPrice,
      oferta: item.oferta || item.Oferta,
      descuento: item.descuento || item.discount,
      Stock: db.Stock,
      quantity_per_bundle: quantityPerBundle,
      nombre: db.nombre || item.nombre,
    };
  }) as CartValidationItem[];
}
