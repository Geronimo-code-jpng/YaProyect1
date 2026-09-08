import type { OrderItem } from "../lib";

export interface AdminOrder {
  id: number;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  notas?: string;
  total: number;
  carrito: OrderItem[];
  estado: string;
  created_at?: string;
  expira_en?: string | null;
  fuente: string; // "web" | "manual"
  metodo: string; // "envio" | "retiro"
  metodo_pago?: string;
  pagado_manualmente?: boolean;
}

export type SourceFilter = "todos" | "web" | "manual";
export type DateRange = "todo" | "hoy" | "7d";
export type OrderSort = "recientes" | "antiguos" | "monto-desc" | "monto-asc";
