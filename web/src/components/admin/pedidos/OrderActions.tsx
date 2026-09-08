"use client";

import { Check, DollarSign, Eye, X } from "lucide-react";
import { Button } from "../../ui";
import type { AdminOrder } from "./types";

export interface OrderActionHandlers {
  onView: (order: AdminOrder) => void;
  onConfigurar: (order: AdminOrder) => void;
  onMarcarPagado: (order: AdminOrder) => void;
  onRechazar: (order: AdminOrder) => void;
}

interface OrderActionsProps extends OrderActionHandlers {
  order: AdminOrder;
  labels?: boolean;
}

export default function OrderActions({
  order,
  labels = false,
  onView,
  onConfigurar,
  onMarcarPagado,
  onRechazar,
}: OrderActionsProps) {
  const isWeb = order.fuente === "web";
  const canConfigurar = isWeb && order.estado === "pendiente";
  const canPagar =
    isWeb && (order.estado === "configurado" || order.estado === "vencido");
  const canRechazar = isWeb && order.estado === "pendiente";

  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-end">
      {canConfigurar && (
        <Button size="sm" icon={Check} onClick={() => onConfigurar(order)}>
          {labels ? "Aceptar" : ""}
        </Button>
      )}
      {canPagar && (
        <Button
          size="sm"
          icon={DollarSign}
          className="bg-green-500 hover:bg-green-600"
          onClick={() => onMarcarPagado(order)}
        >
          {labels ? "Pagado" : ""}
        </Button>
      )}
      {canRechazar && (
        <Button
          size="sm"
          variant="ghost"
          icon={X}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          aria-label="Rechazar"
          onClick={() => onRechazar(order)}
        >
          {labels ? "Rechazar" : ""}
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        icon={Eye}
        aria-label="Ver pedido"
        onClick={() => onView(order)}
      >
        {labels ? "Ver" : ""}
      </Button>
    </div>
  );
}
