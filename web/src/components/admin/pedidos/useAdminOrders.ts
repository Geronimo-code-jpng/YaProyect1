"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPedidosAdmin,
  fetchPedidoById,
  updatePedido,
  cleanupExpiredPedidos,
  fetchConfiguracion,
} from "../../../lib/catalogApi";
import {
  parseCarrito,
  cartSubtotal,
  allowedTransitions,
  openWhatsApp,
  buildConfiguracionMessage,
  buildRechazoMessage,
  buildPagoConfirmadoMessage,
  PAY_WINDOW_MINUTES,
  type PriceChangeLike,
  type OrderItem,
} from "../lib";
import type { AdminOrder } from "./types";

type ToastType = "success" | "error" | "info";

interface Options {
  showToast: (message: string, type?: ToastType) => void;
}

const REFRESH_MS = 30_000;
const CLEANUP_MS = 60_000;

type RawOrder = Record<string, unknown> & {
  carrito?: unknown;
  total?: unknown;
  nombre_cliente?: string;
  nombre?: string;
  telefono?: string;
  direccion?: string;
  metodo?: string;
  metodo_entrega?: string;
  fuente?: string;
};

function normalize(row: RawOrder): AdminOrder {
  return {
    ...(row as unknown as AdminOrder),
    carrito: parseCarrito(row.carrito),
    total: Number(row.total) || 0,
    nombre_cliente: row.nombre_cliente || row.nombre || "Sin nombre",
    telefono: row.telefono || "",
    direccion: row.direccion || "",
    metodo: row.metodo || row.metodo_entrega || "envio",
    fuente: row.fuente || "manual",
  };
}

export function useAdminOrders({ showToast }: Options) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shippingPrice, setShippingPrice] = useState(0);
  const shippingRef = useRef(0);
  const bankAlias = useRef("");
  const inFlight = useRef(false);
  const seq = useRef(0);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (inFlight.current) return;
      inFlight.current = true;
      const mySeq = ++seq.current;
      try {
        const rows = await fetchPedidosAdmin();
        if (mySeq !== seq.current) return; // a newer request already resolved
        setOrders((rows || []).map(normalize));
        setError(null);
      } catch (err) {
        console.error("Error cargando pedidos:", err);
        if (!opts?.silent) setError("No se pudieron cargar los pedidos.");
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [],
  );

  // Initial load + config for WhatsApp messages.
  useEffect(() => {
    refresh();
    fetchConfiguracion()
      .then((c) => {
        if (c) {
          const price = Number(c.precio_envio) || 0;
          shippingRef.current = price;
          setShippingPrice(price);
          bankAlias.current = c.alias || "";
        }
      })
      .catch(() => {});
  }, [refresh]);

  // Single poller — pauses while the tab is hidden.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refresh({ silent: true });
    };
    const id = setInterval(tick, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Expire stale "configurado" orders — slower cadence, also visibility-gated.
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await cleanupExpiredPedidos();
        refresh({ silent: true });
      } catch (err) {
        console.error("Error verificando pedidos vencidos:", err);
      }
    };
    const id = setInterval(tick, CLEANUP_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const patchLocal = useCallback((id: number, patch: Partial<AdminOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  /** Fetch fresh, verify the transition is allowed, PATCH with optimistic guard. */
  const transition = useCallback(
    async (
      id: number,
      next: string,
      extra: Record<string, unknown>,
      after: (fresh: AdminOrder) => void | Promise<void>,
    ) => {
      try {
        const raw = await fetchPedidoById(id);
        if (!raw) {
          showToast("Pedido no encontrado", "error");
          return;
        }
        const fresh = normalize(raw);
        const allowed = allowedTransitions(fresh.estado, fresh.fuente) as string[];
        if (next !== fresh.estado && !allowed.includes(next)) {
          showToast(
            `No se puede pasar de "${fresh.estado}" a "${next}"`,
            "error",
          );
          await refresh({ silent: true });
          return;
        }
        const updated = await updatePedido(id, { estado: next, ...extra }, fresh.estado);
        if (!updated) {
          showToast("El pedido cambió de estado. Actualizando…", "error");
          await refresh({ silent: true });
          return;
        }
        patchLocal(id, { estado: next, ...(extra as Partial<AdminOrder>) });
        await after(fresh);
        refresh({ silent: true });
      } catch (err) {
        console.error(`Error cambiando estado a ${next}:`, err);
        showToast("Error al cambiar el estado del pedido", "error");
      }
    },
    [patchLocal, refresh, showToast],
  );

  const configurar = useCallback(
    (id: number, win: Window | null) => {
      const expira = new Date(
        Date.now() + PAY_WINDOW_MINUTES * 60 * 1000,
      ).toISOString();
      return transition(id, "configurado", { expira_en: expira }, (fresh) => {
        const items = fresh.carrito.filter((i) => i.cantidad > 0);
        const subtotal = cartSubtotal(items);
        const envio = fresh.metodo === "retiro" ? 0 : shippingRef.current;
        openWhatsApp(
          win,
          fresh.telefono,
          buildConfiguracionMessage({
            order: fresh,
            subtotal,
            envio,
            alias: bankAlias.current,
          }),
        );
        showToast(
          `Pedido #${id} configurado — ${PAY_WINDOW_MINUTES} min para pagar`,
        );
      });
    },
    [transition, showToast],
  );

  const marcarPagado = useCallback(
    (id: number, win: Window | null) =>
      transition(
        id,
        "pagado",
        { pagado_manualmente: true, fecha_pago: new Date().toISOString() },
        (fresh) => {
          openWhatsApp(win, fresh.telefono, buildPagoConfirmadoMessage({ order: fresh }));
          showToast(`Pedido #${id} marcado como pagado`);
        },
      ),
    [transition, showToast],
  );

  const rechazar = useCallback(
    (id: number, motivo: string, win: Window | null) =>
      transition(id, "rechazado", { notas: motivo }, (fresh) => {
        openWhatsApp(
          win,
          fresh.telefono,
          buildRechazoMessage({ order: fresh, motivo }),
        );
        showToast(`Pedido #${id} rechazado`);
      }),
    [transition, showToast],
  );

  /** Plain state correction (revert to pendiente / mark vencido) — no notification. */
  const forzarEstado = useCallback(
    (id: number, next: string) =>
      transition(id, next, {}, () => {
        showToast(`Estado del pedido #${id} cambiado a "${next}"`);
      }),
    [transition, showToast],
  );

  /** Persist an edited cart + recomputed total. Estado unchanged. */
  const saveEdits = useCallback(
    async (order: AdminOrder, carrito: OrderItem[]) => {
      const subtotal = cartSubtotal(carrito);
      const envio = order.metodo === "retiro" ? 0 : shippingRef.current;
      try {
        const updated = await updatePedido(order.id, {
          carrito,
          total: subtotal + envio,
        });
        if (!updated) throw new Error("no-op");
        patchLocal(order.id, { carrito, total: subtotal + envio });
        showToast("Cambios guardados");
        refresh({ silent: true });
        return true;
      } catch (err) {
        console.error("Error guardando cambios del pedido:", err);
        showToast("Error al guardar los cambios", "error");
        return false;
      }
    },
    [patchLocal, refresh, showToast],
  );

  /** Persist edits, re-arm the pay window, and notify the client. */
  const saveAndNotify = useCallback(
    async (
      order: AdminOrder,
      carrito: OrderItem[],
      priceChanges: PriceChangeLike[],
      win: Window | null,
    ) => {
      const subtotal = cartSubtotal(carrito);
      const envio = order.metodo === "retiro" ? 0 : shippingRef.current;
      const expira = new Date(
        Date.now() + PAY_WINDOW_MINUTES * 60 * 1000,
      ).toISOString();
      try {
        const updated = await updatePedido(order.id, {
          carrito,
          total: subtotal + envio,
          estado: "configurado",
          expira_en: expira,
        });
        if (!updated) throw new Error("no-op");
        patchLocal(order.id, {
          carrito,
          total: subtotal + envio,
          estado: "configurado",
          expira_en: expira,
        });
        openWhatsApp(
          win,
          order.telefono,
          buildConfiguracionMessage({
            order: { ...order, carrito },
            subtotal,
            envio,
            alias: bankAlias.current,
            priceChanges,
          }),
        );
        showToast("Pedido actualizado y cliente notificado");
        refresh({ silent: true });
        return true;
      } catch (err) {
        console.error("Error guardando y notificando:", err);
        showToast("Error al guardar los cambios", "error");
        return false;
      }
    },
    [patchLocal, refresh, showToast],
  );

  return {
    orders,
    loading,
    error,
    shippingPrice,
    refresh,
    configurar,
    marcarPagado,
    rechazar,
    forzarEstado,
    saveEdits,
    saveAndNotify,
  };
}
