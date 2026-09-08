"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Modal, Button, Input, Badge } from "../../ui";
import {
  validateCartItems,
  computeUpdatedCart,
  type PriceChange,
} from "../../../utils/validateCartItems";
import {
  cartSubtotal,
  lineUnitPrice,
  itemProductId,
  formatMoneda,
  statusLabel,
  statusTone,
  allowedTransitions,
  ORDER_STATUS_META,
  type OrderItem,
  type PriceChangeLike,
} from "../lib";
import type { AdminOrder } from "./types";

type ToastType = "success" | "error" | "info";

interface OrderEditModalProps {
  order: AdminOrder | null;
  open: boolean;
  onClose: () => void;
  shippingPrice: number;
  onTransition: (order: AdminOrder, next: string) => void;
  onSaveEdits: (order: AdminOrder, carrito: OrderItem[]) => Promise<boolean>;
  onSaveAndNotify: (
    order: AdminOrder,
    carrito: OrderItem[],
    changes: PriceChangeLike[],
    win: Window | null,
  ) => Promise<boolean>;
  showToast: (message: string, type?: ToastType) => void;
}

interface Comparison {
  loading: boolean;
  done: boolean;
  results: PriceChange[];
  dbProducts: Record<number, unknown>;
}

const EMPTY_COMPARISON: Comparison = {
  loading: false,
  done: false,
  results: [],
  dbProducts: {},
};

export default function OrderEditModal({
  order,
  open,
  onClose,
  shippingPrice,
  onTransition,
  onSaveEdits,
  onSaveAndNotify,
  showToast,
}: OrderEditModalProps) {
  const [carrito, setCarrito] = useState<OrderItem[]>([]);
  const [comparison, setComparison] = useState<Comparison>(EMPTY_COMPARISON);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    setCarrito(order.carrito.map((i) => ({ ...i, Id: itemProductId(i) })));
    setComparison(EMPTY_COMPARISON);
  }, [open, order]);

  const subtotal = useMemo(() => cartSubtotal(carrito), [carrito]);
  const envio = order?.metodo === "retiro" ? 0 : shippingPrice;
  const total = subtotal + envio;

  if (!order) return null;

  const transitions = allowedTransitions(order.estado, order.fuente);

  const setLine = (index: number, patch: Partial<OrderItem>) =>
    setCarrito((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );

  const compare = async () => {
    setComparison((c) => ({ ...c, loading: true }));
    try {
      const items = carrito.map((it) => ({
        Id: Number(itemProductId(it)),
        nombre: it.nombre || "Producto",
        precio: lineUnitPrice(it),
        Stock: true,
        Oferta: it.Oferta ?? it.oferta,
        cantidad: it.cantidad || 1,
        tipo: it.tipo || "Bulto",
        quantity_per_bundle: it.quantity_per_bundle || 1,
      }));
      const result = await validateCartItems(items);
      setComparison({
        loading: false,
        done: true,
        results: result.changes,
        dbProducts: result.dbProducts || {},
      });
    } catch (err) {
      console.error("Error comparando precios:", err);
      setComparison(EMPTY_COMPARISON);
      showToast("Error al comparar precios", "error");
    }
  };

  const applyChanges = (onlyId?: number) => {
    const dbProducts = comparison.dbProducts as Record<number, unknown>;
    const updated = computeUpdatedCart(
      carrito.map((it) => ({
        ...it,
        Id: Number(itemProductId(it)),
      })) as never,
      dbProducts as never,
    ) as unknown as OrderItem[];
    setCarrito((prev) =>
      prev.map((it, i) => {
        const id = Number(itemProductId(it));
        if (onlyId !== undefined && id !== onlyId) return it;
        return { ...it, ...updated[i] };
      }),
    );
    showToast(
      onlyId !== undefined ? "Producto actualizado" : "Precios actualizados",
    );
  };

  const manualChanges = (): PriceChangeLike[] => {
    const out: PriceChangeLike[] = [];
    carrito.forEach((it, i) => {
      const orig = order.carrito[i];
      if (!orig || it.cantidad <= 0) return;
      const before = lineUnitPrice(orig);
      const after = lineUnitPrice(it);
      if (before !== after) {
        out.push({
          nombre: it.nombre || "Producto",
          cambios: [
            {
              campo: "precio",
              valorViejo: formatMoneda(before),
              valorNuevo: formatMoneda(after),
            },
          ],
        });
      }
    });
    // Merge in comparison results not already covered by name.
    for (const r of comparison.results) {
      if (!out.some((o) => o.nombre === r.nombre)) out.push(r);
    }
    return out;
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSaveEdits(order, carrito);
    setSaving(false);
    if (ok) onClose();
  };

  const handleSaveNotify = async () => {
    const win = window.open("", "_blank");
    setSaving(true);
    const ok = await onSaveAndNotify(order, carrito, manualChanges(), win);
    setSaving(false);
    if (ok) onClose();
    else win?.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={comparison.results.length > 0 ? "xl" : "lg"}
      title={`Pedido #${order.id}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {transitions.map((next) => (
              <Button
                key={next}
                size="sm"
                variant={next === "rechazado" ? "danger" : "secondary"}
                onClick={() => onTransition(order, next)}
              >
                → {ORDER_STATUS_META[next].label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Save}
              loading={saving}
              onClick={handleSave}
            >
              Guardar cambios
            </Button>
            <Button
              size="sm"
              icon={Send}
              loading={saving}
              onClick={handleSaveNotify}
            >
              Guardar y notificar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Client info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Field label="Cliente" value={order.nombre_cliente} />
          <Field label="Teléfono" value={order.telefono || "—"} />
          <Field
            label="Entrega"
            value={
              order.metodo === "retiro"
                ? "Retiro en sucursal"
                : order.direccion || "Sin dirección"
            }
          />
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Estado</p>
            <Badge tone={statusTone(order.estado)} className="mt-1">
              {statusLabel(order.estado)}
            </Badge>
          </div>
          {order.notas && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs font-bold uppercase text-gray-400">Notas</p>
              <p className="font-medium text-gray-700">📝 {order.notas}</p>
            </div>
          )}
        </div>

        <div
          className={
            comparison.results.length > 0
              ? "grid grid-cols-1 lg:grid-cols-5 gap-4"
              : ""
          }
        >
          {/* Line items */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-500">
                Productos
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                loading={comparison.loading}
                onClick={compare}
              >
                Comparar precios
              </Button>
            </div>

            {carrito.map((item, index) => {
              const removed = item.cantidad === 0;
              const pid = itemProductId(item);
              return (
                <div
                  key={index}
                  className={`rounded-xl border p-3 ${
                    removed
                      ? "border-red-100 bg-red-50/60 opacity-70"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm leading-tight">
                        {removed ? <s>{item.nombre}</s> : item.nombre}
                        {pid && (
                          <a
                            href={`/producto/${pid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex ml-1.5 text-brand align-middle"
                            title="Ver en tienda"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </p>
                      <span className="text-[11px] font-bold text-gray-400 uppercase">
                        {item.tipo || "Bulto"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
                        <button
                          type="button"
                          aria-label="Restar"
                          className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                          disabled={removed}
                          onClick={() =>
                            setLine(index, {
                              cantidad: Math.max(0, item.cantidad - 1),
                            })
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-sm font-bold tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          aria-label="Sumar"
                          className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
                          onClick={() =>
                            setLine(index, { cantidad: item.cantidad + 1 })
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Quitar"
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                        disabled={removed}
                        onClick={() => setLine(index, { cantidad: 0 })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        value={lineUnitPrice(item)}
                        disabled={removed}
                        onChange={(e) => {
                          const precio = Math.max(
                            0,
                            parseInt(e.target.value) || 0,
                          );
                          setLine(index, { precio, precio_unitario: precio });
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">c/u</span>
                    {item.cantidad > 0 && (
                      <span className="text-sm font-bold text-gray-700 tabular-nums ml-auto">
                        {formatMoneda(lineUnitPrice(item) * item.cantidad)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price comparison panel */}
          {comparison.results.length > 0 && (
            <div className="lg:col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-800">
                  {comparison.results.length} con cambios
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => applyChanges()}
                >
                  Actualizar todo
                </Button>
              </div>
              {comparison.results.map((change, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-200 bg-white p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-800 text-sm truncate">
                      {change.nombre}
                    </span>
                    <Badge tone="neutral">{change.tipo}</Badge>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {change.cambios.map((c, ci) => (
                      <div
                        key={ci}
                        className="flex items-center gap-1.5 text-xs bg-gray-50 rounded px-2 py-1"
                      >
                        <span className="uppercase font-bold text-gray-500">
                          {c.campo}
                        </span>
                        {c.campo === "existencia" || c.campo === "stock" ? (
                          <span className="text-red-600 font-bold">
                            {String(c.valorNuevo)}
                          </span>
                        ) : (
                          <>
                            <span className="text-gray-400 line-through">
                              {String(c.valorViejo)}
                            </span>
                            <ArrowRight size={10} className="text-gray-300" />
                            <span className="text-red-600 font-bold">
                              {String(c.valorNuevo)}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth
                    className="mt-2"
                    onClick={() => applyChanges(change.Id)}
                  >
                    Actualizar este
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatMoneda(subtotal)} />
          {order.metodo !== "retiro" && (
            <Row label="Envío" value={formatMoneda(envio)} />
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
            <span className="font-black text-gray-700">Total</span>
            <span className="font-black text-brand text-lg tabular-nums">
              {formatMoneda(total)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
      <p className="font-bold text-gray-800 break-words">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
