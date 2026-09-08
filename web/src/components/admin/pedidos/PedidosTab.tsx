"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { Pagination, PAGE_SIZES } from "../../ui";
import RejectDialog from "../RejectDialog";
import { statusLabel } from "../lib";
import { useAdminOrders } from "./useAdminOrders";
import OrderStatsCards from "./OrderStatsCards";
import OrdersToolbar from "./OrdersToolbar";
import OrdersTable from "./OrdersTable";
import OrderList from "./OrderList";
import OrderEditModal from "./OrderEditModal";
import type {
  AdminOrder,
  DateRange,
  OrderSort,
  SourceFilter,
} from "./types";

type ToastType = "success" | "error" | "info";

interface PedidosTabProps {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    tone?: "brand" | "danger",
  ) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export default function PedidosTab({ showToast, showConfirm }: PedidosTabProps) {
  const orders = useAdminOrders({ showToast });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [source, setSource] = useState<SourceFilter>("todos");
  const [range, setRange] = useState<DateRange>("todo");
  const [sort, setSort] = useState<OrderSort>("recientes");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);

  const [editing, setEditing] = useState<AdminOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reject, setReject] = useState<{ order: AdminOrder } | null>(null);

  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    const now = Date.now();

    let list = orders.orders.filter((o) => {
      if (status !== "todos" && o.estado !== status) return false;
      if (source !== "todos" && o.fuente !== source) return false;
      if (range !== "todo" && o.created_at) {
        const age = now - new Date(o.created_at).getTime();
        if (range === "hoy") {
          const d = new Date(o.created_at);
          const today = new Date();
          if (d.toDateString() !== today.toDateString()) return false;
        } else if (range === "7d" && age > 7 * DAY_MS) {
          return false;
        }
      }
      if (q) {
        const matchesText =
          String(o.id).includes(q) ||
          o.nombre_cliente.toLowerCase().includes(q) ||
          (qDigits && o.telefono.replace(/\D/g, "").includes(qDigits));
        if (!matchesText) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "antiguos":
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        case "monto-desc":
          return b.total - a.total;
        case "monto-asc":
          return a.total - b.total;
        default:
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
      }
    });
    return list;
  }, [orders.orders, deferredSearch, status, source, range, sort]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, source, range, sort, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleConfigurar = (order: AdminOrder) => {
    showConfirm(
      `¿Aceptar el pedido #${order.id}? Se inician 15 minutos para pagar y se notifica al cliente por WhatsApp.`,
      () => {
        const win = window.open("", "_blank");
        orders.configurar(order.id, win);
      },
    );
  };

  const handleMarcarPagado = (order: AdminOrder) => {
    showConfirm(
      `¿Marcar el pedido #${order.id} como pagado? Se notifica al cliente por WhatsApp.`,
      () => {
        const win = window.open("", "_blank");
        orders.marcarPagado(order.id, win);
      },
    );
  };

  const handleRechazar = (order: AdminOrder) => setReject({ order });

  const handleView = (order: AdminOrder) => {
    setEditing(order);
    setModalOpen(true);
  };

  const handleTransition = (order: AdminOrder, next: string) => {
    closeModal();
    if (next === "configurado") return handleConfigurar(order);
    if (next === "pagado") return handleMarcarPagado(order);
    if (next === "rechazado") return handleRechazar(order);
    showConfirm(
      `¿Cambiar el pedido #${order.id} a "${statusLabel(next)}"? No se notifica al cliente.`,
      () => orders.forzarEstado(order.id, next),
    );
  };

  const rowHandlers = {
    onView: handleView,
    onConfigurar: handleConfigurar,
    onMarcarPagado: handleMarcarPagado,
    onRechazar: handleRechazar,
  };

  return (
    <div className="space-y-5">
      <OrderStatsCards
        orders={orders.orders}
        active={status}
        onSelect={setStatus}
      />

      <OrdersToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        source={source}
        onSource={setSource}
        range={range}
        onRange={setRange}
        sort={sort}
        onSort={setSort}
        total={orders.orders.length}
        shown={filtered.length}
        loading={orders.loading}
        onRefresh={() => orders.refresh()}
      />

      {orders.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {orders.error}
        </div>
      )}

      {orders.loading && orders.orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
          <p className="font-bold">Cargando pedidos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Inbox size={48} className="mx-auto mb-3" />
          <p className="font-bold text-lg">
            {orders.orders.length === 0
              ? "No hay pedidos"
              : "Ningún pedido coincide con el filtro"}
          </p>
        </div>
      ) : (
        <>
          <OrdersTable orders={paged} {...rowHandlers} />
          <OrderList orders={paged} {...rowHandlers} />
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={setPageSize}
            label="pedidos"
          />
        </>
      )}

      <OrderEditModal
        order={editing}
        open={modalOpen}
        onClose={closeModal}
        shippingPrice={orders.shippingPrice}
        onTransition={handleTransition}
        onSaveEdits={orders.saveEdits}
        onSaveAndNotify={orders.saveAndNotify}
        showToast={showToast}
      />

      {reject && (
        <RejectDialog
          message={`¿Rechazar el pedido #${reject.order.id}? Indicá el motivo (se guarda y se envía al cliente).`}
          onCancel={() => setReject(null)}
          onConfirm={(motivo: string) => {
            const order = reject.order;
            setReject(null);
            const win = window.open("", "_blank");
            orders.rechazar(order.id, motivo, win);
          }}
        />
      )}
    </div>
  );
}
