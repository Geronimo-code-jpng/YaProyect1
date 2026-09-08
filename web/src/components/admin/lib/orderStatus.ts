type BadgeTone = "neutral" | "success" | "danger" | "warning" | "brand";

/** The only order states any flow actually produces. */
export const ORDER_STATUSES = [
  "pendiente",
  "configurado",
  "pagado",
  "rechazado",
  "vencido",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: BadgeTone }
> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  configurado: { label: "Configurado", tone: "brand" },
  pagado: { label: "Pagado", tone: "success" },
  rechazado: { label: "Rechazado", tone: "danger" },
  vencido: { label: "Vencido", tone: "neutral" },
};

export function statusLabel(status: string): string {
  return ORDER_STATUS_META[status as OrderStatus]?.label ?? status;
}

export function statusTone(status: string): BadgeTone {
  return ORDER_STATUS_META[status as OrderStatus]?.tone ?? "neutral";
}

/**
 * Valid next states from `status`. Web orders follow the lifecycle; manual
 * orders get a looser set (admin override) since they have no timed flow.
 */
export function allowedTransitions(
  status: string,
  fuente?: string,
): OrderStatus[] {
  const web: Record<OrderStatus, OrderStatus[]> = {
    pendiente: ["configurado", "rechazado"],
    configurado: ["pagado", "vencido", "pendiente"],
    vencido: ["configurado", "pagado", "pendiente"],
    pagado: ["configurado"],
    rechazado: ["pendiente"],
  };
  if (fuente === "web") return web[status as OrderStatus] ?? [];
  return ORDER_STATUSES.filter((s) => s !== status);
}
