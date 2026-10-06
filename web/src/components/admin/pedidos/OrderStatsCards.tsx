"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ORDER_STATUS_META, type OrderStatus } from "../lib";

const CARD_STATUSES: OrderStatus[] = ["pendiente", "aprobado", "pagado", "rechazado", "cancelado"];
import type { AdminOrder } from "./types";

interface OrderStatsCardsProps {
  orders: AdminOrder[];
  active: string;
  onSelect: (status: string) => void;
}

const TONE_TEXT: Record<string, string> = {
  warning: "text-amber-600",
  brand: "text-brand",
  success: "text-green-600",
  danger: "text-red-600",
  neutral: "text-gray-600",
};

export default function OrderStatsCards({
  orders,
  active,
  onSelect,
}: OrderStatsCardsProps) {
  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const o of orders) acc[o.estado] = (acc[o.estado] || 0) + 1;
    return acc;
  }, [orders]);

  // Las tarjetas son de los estados que hoy produce el sistema; los viejos
  // (configurado, vencido, modificado) se filtran desde el selector
  const cards = [
    ...CARD_STATUSES.map((s) => ({
      key: s,
      label: ORDER_STATUS_META[s].label,
      count: counts[s] || 0,
      text: TONE_TEXT[ORDER_STATUS_META[s].tone],
    })),
    { key: "todos", label: "Total", count: orders.length, text: "text-gray-800" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onSelect(c.key)}
          className={clsx(
            "rounded-2xl p-3 text-left border transition cursor-pointer",
            active === c.key
              ? "border-brand ring-2 ring-brand/20 bg-white"
              : "border-gray-200 bg-white hover:shadow-sm",
          )}
        >
          <div className={clsx("text-2xl font-black tabular-nums", c.text)}>
            {c.count}
          </div>
          <div className="text-xs font-bold text-gray-500 mt-0.5">{c.label}</div>
        </button>
      ))}
    </div>
  );
}
