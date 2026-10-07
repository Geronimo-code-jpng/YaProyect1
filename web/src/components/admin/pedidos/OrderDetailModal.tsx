"use client";

import { Modal, Badge } from "../../ui";
import { formatFechaHora } from "../../../utils/formatFechaHora";
import {
  formatMoneda,
  lineTotal,
  lineUnitPrice,
  sistemaEstadoLabel,
  statusLabel,
  statusTone,
} from "../lib";
import type { AdminOrder } from "./types";

interface OrderDetailModalProps {
  order: AdminOrder | null;
  open: boolean;
  onClose: () => void;
}

// Solo se mira: el pedido lo maneja el sistema del negocio.
export default function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const items = order.carrito.filter((i) => (i.cantidad || 0) > 0);
  const subtotal = items.reduce((a, i) => a + lineTotal(i), 0);
  const recargo = Number(order.recargo) || 0;
  const envio = Math.max(0, order.total - recargo - subtotal);

  return (
    <Modal open={open} onClose={onClose} title={`Pedido #${order.id}`} size="lg">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(order.estado)}>{statusLabel(order.estado)}</Badge>
          {order.fuente === "web" && <Badge tone="brand">Web</Badge>}
          <span className="text-gray-500">{formatFechaHora(order.created_at)}</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
            En el negocio
          </p>
          <p className="font-bold text-gray-800">{sistemaEstadoLabel(order.sistema_estado)}</p>
          {order.sistema_numero && (
            <p className="text-gray-600">Pedido N° {order.sistema_numero} en el sistema</p>
          )}
          {order.sistema_motivo && (
            <p className="text-red-600 font-medium mt-1">Motivo: {order.sistema_motivo}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Los pedidos se aceptan, rechazan y cobran desde el sistema del negocio.
          </p>
        </div>

        <div>
          <p className="font-bold text-gray-800">{order.nombre_cliente}</p>
          <p className="text-gray-500">{order.telefono || "—"}</p>
          <p className="text-gray-500">
            {order.metodo === "retiro" ? "Retira en el local" : order.direccion || "Sin dirección"}
          </p>
          {order.notas && <p className="text-amber-700 font-medium mt-1">📝 {order.notas}</p>}
        </div>

        <table className="w-full text-left">
          <thead className="text-xs uppercase text-gray-400">
            <tr>
              <th className="py-1">Producto</th>
              <th className="py-1 text-right">Cant.</th>
              <th className="py-1 text-right">Precio</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((i, k) => (
              <tr key={k}>
                <td className="py-1.5">
                  {i.nombre || "Producto"}
                  <span className="text-xs text-gray-400"> · {i.tipo || "Bulto"}</span>
                </td>
                <td className="py-1.5 text-right tabular-nums">{i.cantidad}</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoneda(lineUnitPrice(i))}</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoneda(lineTotal(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-gray-200 pt-3">
          {envio > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Envío y ajustes</span>
              <span className="tabular-nums">{formatMoneda(envio)}</span>
            </div>
          )}
          {recargo > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Recargo transferencia</span>
              <span className="tabular-nums">{formatMoneda(recargo)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black text-gray-800">
            <span>Total</span>
            <span className="tabular-nums">{formatMoneda(order.total)}</span>
          </div>
          {order.metodo_pago && (
            <p className="text-xs text-gray-400 uppercase">Pago: {order.metodo_pago}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
