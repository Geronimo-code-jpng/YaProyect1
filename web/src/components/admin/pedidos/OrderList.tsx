"use client";

import { Eye, MapPin, Store } from "lucide-react";
import { Badge, Button } from "../../ui";
import { formatFechaHora } from "../../../utils/formatFechaHora";
import { formatMoneda, sistemaEstadoLabel, statusLabel, statusTone } from "../lib";
import type { AdminOrder } from "./types";

interface OrderListProps {
  orders: AdminOrder[];
  onView: (order: AdminOrder) => void;
}

export default function OrderList({ orders, onView }: OrderListProps) {
  return (
    <div className="md:hidden space-y-3">
      {orders.map((o) => (
        <div
          key={o.id}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-black text-gray-500 tabular-nums">
                #{o.id}
                {o.fuente === "web" && (
                  <Badge tone="brand" className="ml-2">
                    Web
                  </Badge>
                )}
              </div>
              <div className="font-bold text-gray-800 mt-0.5">
                {o.nombre_cliente}
              </div>
              <div className="text-xs text-gray-500">{o.telefono || "—"}</div>
            </div>
            <div className="text-right">
              <div className="font-black text-gray-800 tabular-nums">
                {formatMoneda(o.total)}
              </div>
              <Badge tone={statusTone(o.estado)} className="mt-1">
                {statusLabel(o.estado)}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatFechaHora(o.created_at)}</span>
            <span className="flex items-center gap-1">
              {o.metodo === "retiro" ? (
                <>
                  <Store size={12} /> Retiro
                </>
              ) : (
                <>
                  <MapPin size={12} /> {o.direccion || "Sin dirección"}
                </>
              )}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            {sistemaEstadoLabel(o.sistema_estado)}
            {o.sistema_numero ? ` · N° ${o.sistema_numero}` : ""}
            {o.sistema_motivo && (
              <span className="block text-red-600 font-medium">{o.sistema_motivo}</span>
            )}
          </div>

          {o.notas && (
            <div className="text-xs text-amber-700 font-medium">📝 {o.notas}</div>
          )}

          <div className="border-t border-gray-100 pt-3">
            <Button size="sm" variant="secondary" icon={Eye} fullWidth onClick={() => onView(o)}>
              Ver
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
