import { fetchProductos } from "../lib/catalogApi";
import { hay, precioDe, tieneUnidad, unidadesPorBulto, type Tipo } from "../lib/presentaciones";

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
  oferta?: string;
  descuento?: number;
  discount?: number;
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

  const ids = new Set(cart.map((item) => item.Id));

  const allProducts = await fetchProductos();
  const dbProducts = allProducts.filter((p) => ids.has(p.Id));

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
    const tipo: Tipo = item.tipo === "Unidad" ? "Unidad" : "Bulto";

    if (tipo === "Unidad" && !tieneUnidad(db)) {
      // El sistema dejó de ofrecer la unidad suelta de este artículo
      itemChanges.push({
        campo: "existencia",
        valorViejo: "Por unidad",
        valorNuevo: "Ya no se vende por unidad",
      });
    } else {
      // Stock de LA presentación que está en el carrito: puede quedar sin
      // bultos cerrados y todavía haber unidades sueltas, o al revés
      if (!db.Stock || !hay(db, tipo)) {
        itemChanges.push({
          campo: "stock",
          valorViejo: "Disponible",
          valorNuevo: "Sin stock",
        });
      }

      // El precio de cada presentación lo manda el sistema del negocio
      const currentPrice = precioDe(db, tipo);
      if (currentPrice !== item.precio) {
        itemChanges.push({
          campo: "precio",
          valorViejo: `$${item.precio.toLocaleString("es-AR")}`,
          valorNuevo: `$${currentPrice.toLocaleString("es-AR")}`,
        });
      }
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

    const tipo: Tipo = item.tipo === "Unidad" ? "Unidad" : "Bulto";

    // Sin stock de esa presentación, o ya no se vende por unidad: se saca
    if (!db.Stock || !hay(db, tipo)) {
      return { ...item, cantidad: 0, Stock: false };
    }

    const finalPrice = precioDe(db, tipo);

    return {
      ...item,
      precio: finalPrice,
      precio_unitario: finalPrice,
      oferta: item.oferta || item.Oferta,
      descuento: item.descuento || item.discount,
      Stock: db.Stock,
      quantity_per_bundle: unidadesPorBulto(db),
      nombre: db.nombre || item.nombre,
    };
  }) as CartValidationItem[];
}
