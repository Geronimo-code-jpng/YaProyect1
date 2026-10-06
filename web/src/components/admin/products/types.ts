import type { Product } from "../../../types";

/** Product shape as it comes back from the admin/catalog API (tolerant of legacy quirks). */
export type AdminProduct = Product & {
  imagen?: string;
};

// El catálogo (nombre, precio, rubro, stock, unidades) lo maneja el sistema del
// negocio. Desde la página solo se tocan estas dos marcas, la foto y el precio
// tachado (Oferta).
export type ProductFlag = "oferta_express" | "mas_vendido";

/** Payload handed to `onSave` by <ProductForm>. */
export interface ProductFormValues {
  Oferta: string;
  oferta_express: boolean;
  mas_vendido: boolean;
  imageFile?: File | null;
}

export type StockFilter = "todos" | "con" | "sin";
export type SortKey =
  | "nombre"
  | "precio-asc"
  | "precio-desc"
  | "stock"
  | "vendidos";

export interface ProductRowHandlers {
  onEdit: (id: number) => void;
  onFlag: (id: number, flag: ProductFlag, value: boolean) => void;
}

export const FLAG_META: Record<
  ProductFlag,
  { label: string; tone: "green" | "yellow" }
> = {
  oferta_express: { label: "Oferta Express", tone: "green" },
  mas_vendido: { label: "Más Vendido", tone: "yellow" },
};
