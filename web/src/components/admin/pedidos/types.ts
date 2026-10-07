import type { OrderItem } from "../lib";

export interface AdminOrder {
  id: number;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  notas?: string;
  total: number;
  /** Recargo por transferencia, ya incluido en total */
  recargo?: number | string | null;
  carrito: OrderItem[];
  estado: string;
  created_at?: string;
  expira_en?: string | null;
  fuente: string; // "web" | "manual"
  metodo: string; // "envio" | "retiro"
  metodo_pago?: string;
  pagado_manualmente?: boolean;
  // Lo que el sistema del negocio hizo con el pedido
  sistema_estado?: string | null;
  sistema_numero?: string | null;
  sistema_motivo?: string | null;
  sistema_recibido_en?: string | null;
}

export type SourceFilter = "todos" | "web" | "manual";
export type DateRange = "todo" | "hoy" | "7d";
export type OrderSort = "recientes" | "antiguos" | "monto-desc" | "monto-asc";
