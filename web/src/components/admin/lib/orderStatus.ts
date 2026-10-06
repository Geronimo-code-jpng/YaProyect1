type BadgeTone = "neutral" | "success" | "danger" | "warning" | "brand";

// Los pedidos de la tienda los maneja el sistema del negocio (deposito-ia): ahí
// se aceptan, se rechazan, se corrigen y se cobran, y el sistema le cuenta a la
// tienda cómo quedó cada uno. Desde el panel solo se miran.
//
// "configurado" y "vencido" son del circuito viejo (el admin los movía a mano):
// ya nadie los produce, pero quedan pedidos viejos con esos estados.
export const ORDER_STATUSES = [
  "pendiente",
  "aprobado",
  "modificado",
  "pagado",
  "rechazado",
  "cancelado",
  "configurado",
  "vencido",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: BadgeTone }
> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  aprobado: { label: "Aprobado", tone: "brand" },
  modificado: { label: "Modificado", tone: "brand" },
  pagado: { label: "Pagado", tone: "success" },
  rechazado: { label: "Rechazado", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "neutral" },
  configurado: { label: "Configurado", tone: "brand" },
  vencido: { label: "Vencido", tone: "neutral" },
};

export function statusLabel(status: string): string {
  return ORDER_STATUS_META[status as OrderStatus]?.label ?? status;
}

export function statusTone(status: string): BadgeTone {
  return ORDER_STATUS_META[status as OrderStatus]?.tone ?? "neutral";
}

/** Lo que el sistema del negocio hizo con el pedido, en castellano. */
const SISTEMA_ESTADO: Record<string, string> = {
  recibido: "Recibido en el negocio",
  aceptado: "Aceptado: se está preparando",
  modificado: "Aceptado, con cambios",
  cobrado: "Cobrado",
  rechazado: "Rechazado",
  anulado: "Anulado",
};

export function sistemaEstadoLabel(estado?: string | null): string {
  return estado ? SISTEMA_ESTADO[estado] ?? estado : "Todavía no lo vio el sistema";
}
