"use client";

import { Eye, MapPin, Store } from "lucide-react";
import { Badge, Button } from "../../ui";
import { formatFechaHora } from "../../../utils/formatFechaHora";
import { formatMoneda, sistemaEstadoLabel, statusLabel, statusTone } from "../lib";
import type { AdminOrder } from "./types";

interface OrdersTableProps {
  orders: AdminOrder[];
  onView: (order: AdminOrder) => void;
}

export default function OrdersTable({ orders, onView }: OrdersTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <tr>
            <th className="p-3 font-black">Pedido</th>
            <th className="p-3 font-black">Cliente</th>
            <th className="p-3 font-black">Fecha</th>
            <th className="p-3 font-black text-right">Total</th>
            <th className="p-3 font-black">Estado</th>
            <th className="p-3 font-black text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="p-3 align-top">
                <div className="font-black text-gray-500 tabular-nums">
                  #{o.id}
                </div>
                {o.fuente === "web" && (
                  <Badge tone="brand" className="mt-1">
                    Web
                  </Badge>
                )}
              </td>
              <td className="p-3 align-top">
                <div className="font-bold text-gray-800">{o.nombre_cliente}</div>
                <div className="text-xs text-gray-500">{o.telefono || "—"}</div>
                <div className="text-xs mt-1 flex items-center gap-1 text-gray-500">
                  {o.metodo === "retiro" ? (
                    <>
                      <Store size={12} /> Retira en sucursal
                    </>
                  ) : (
                    <>
                      <MapPin size={12} /> {o.direccion || "Sin dirección"}
                    </>
                  )}
                </div>
                {o.notas && (
                  <div className="text-xs mt-1 text-amber-700 font-medium">
                    📝 {o.notas}
                  </div>
                )}
              </td>
              <td className="p-3 align-top text-gray-600 whitespace-nowrap">
                {formatFechaHora(o.created_at)}
              </td>
              <td className="p-3 align-top text-right">
                <div className="font-black text-gray-800 tabular-nums">
                  {formatMoneda(o.total)}
                </div>
                <div className="text-xs text-gray-400 uppercase">
                  {o.metodo}
                  {o.metodo_pago ? ` · ${o.metodo_pago}` : ""}
                </div>
              </td>
              <td className="p-3 align-top">
                <Badge tone={statusTone(o.estado)}>
                  {statusLabel(o.estado)}
                </Badge>
                <div className="mt-1 text-xs text-gray-500">
                  {sistemaEstadoLabel(o.sistema_estado)}
                  {o.sistema_numero ? ` · N° ${o.sistema_numero}` : ""}
                </div>
                {o.sistema_motivo && (
                  <div className="mt-1 text-xs text-red-600 font-medium">{o.sistema_motivo}</div>
                )}
              </td>
              <td className="p-3 align-top">
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" icon={Eye} aria-label="Ver pedido" onClick={() => onView(o)}>
                    Ver
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
