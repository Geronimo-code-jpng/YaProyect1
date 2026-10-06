"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPedidosAdmin } from "../../../lib/catalogApi";
import { parseCarrito } from "../lib";
import type { AdminOrder } from "./types";

type ToastType = "success" | "error" | "info";

interface Options {
  showToast: (message: string, type?: ToastType) => void;
}

const REFRESH_MS = 30_000;

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

// Solo lectura: los pedidos los acepta, rechaza, corrige y cobra el sistema del
// negocio. El panel los trae y los muestra, con lo que el sistema le contó
// (sistema_estado, sistema_numero, sistema_motivo).
export function useAdminOrders({ showToast }: Options) {
  void showToast;
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const seq = useRef(0);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Single poller — pauses while the tab is hidden.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refresh({ silent: true });
    };
    const id = setInterval(tick, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { orders, loading, error, refresh };
}
