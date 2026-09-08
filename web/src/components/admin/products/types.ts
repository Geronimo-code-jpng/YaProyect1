import type { Product } from "../../../types";

/** Product shape as it comes back from the admin/catalog API (tolerant of legacy quirks). */
export type AdminProduct = Product & {
  imagen?: string;
};

export type ProductFlag = "oferta_express" | "mas_vendido" | "solo_bulto";

/** Payload handed to `onSave` by <ProductForm>. Matches the previous ProductModal contract. */
export interface ProductFormValues {
  nombre: string;
  precio: number;
  Categoria: string;
  Oferta: string;
  Stock: boolean;
  quantity: number;
  oferta_express: boolean;
  mas_vendido: boolean;
  solo_bulto: boolean;
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
  onRemove: (id: number) => void;
  onFlag: (id: number, flag: ProductFlag, value: boolean) => void;
  onQuantity: (id: number, quantity: number) => void;
  onQuantityCommit: (id: number) => void;
}

export const FLAG_META: Record<
  ProductFlag,
  { label: string; tone: "green" | "yellow" | "blue" }
> = {
  oferta_express: { label: "Oferta Express", tone: "green" },
  mas_vendido: { label: "Más Vendido", tone: "yellow" },
  solo_bulto: { label: "Solo Bulto", tone: "blue" },
};
