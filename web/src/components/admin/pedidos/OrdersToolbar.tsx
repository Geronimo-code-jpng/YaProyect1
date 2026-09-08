"use client";

import { RefreshCw, Search } from "lucide-react";
import { Button, Input, Select } from "../../ui";
import { ORDER_STATUSES, ORDER_STATUS_META } from "../lib";
import type { DateRange, OrderSort, SourceFilter } from "./types";

interface OrdersToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  source: SourceFilter;
  onSource: (v: SourceFilter) => void;
  range: DateRange;
  onRange: (v: DateRange) => void;
  sort: OrderSort;
  onSort: (v: OrderSort) => void;
  total: number;
  shown: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function OrdersToolbar({
  search,
  onSearch,
  status,
  onStatus,
  source,
  onSource,
  range,
  onRange,
  sort,
  onSort,
  total,
  shown,
  loading,
  onRefresh,
}: OrdersToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-zinc-800">Pedidos</h2>
          <p className="text-sm text-gray-500 font-medium">
            {shown === total
              ? `${total} pedido${total !== 1 ? "s" : ""}`
              : `${shown} de ${total} pedidos`}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={onRefresh}
        >
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          icon={Search}
          placeholder="Buscar por nombre, teléfono o #ID…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <Select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </Select>
        <Select
          value={source}
          onChange={(e) => onSource(e.target.value as SourceFilter)}
          aria-label="Filtrar por origen"
        >
          <option value="todos">Todo origen</option>
          <option value="web">Web</option>
          <option value="manual">Manual</option>
        </Select>
        <Select
          value={range}
          onChange={(e) => onRange(e.target.value as DateRange)}
          aria-label="Filtrar por fecha"
        >
          <option value="todo">Cualquier fecha</option>
          <option value="hoy">Hoy</option>
          <option value="7d">Últimos 7 días</option>
        </Select>
        <Select
          value={sort}
          onChange={(e) => onSort(e.target.value as OrderSort)}
          aria-label="Ordenar"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
          <option value="monto-desc">Mayor monto</option>
          <option value="monto-asc">Menor monto</option>
        </Select>
      </div>
    </div>
  );
}
