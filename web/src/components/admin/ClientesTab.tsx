"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchClientesAdmin,
  enviarRecordatorioSinCompra,
  enviarRecordatorioCarritoAbandonado,
} from "../../lib/catalogApi";
import { formatFechaHora, formatFechaCorta } from "../../utils/formatFechaHora";

const money = (n: number) => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");

interface CompraItem {
  Id: number | string | null;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  tipo: string;
}
interface Compra {
  id: number;
  fecha: string | null;
  estado: string;
  total: number;
  metodo: string | null;
  metodo_pago: string | null;
  fuente: string | null;
  items: CompraItem[];
}
interface Cliente {
  key: string;
  tipo: "cuenta" | "invitado";
  perfil_id: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
  tipo_cliente: string | null;
  rol: string | null;
  registrado_en: string | null;
  pedidos_total: number;
  pedidos_pagados: number;
  total_gastado: number;
  total_pendiente: number;
  ticket_promedio: number;
  primer_pedido: string | null;
  ultimo_pedido: string | null;
  estados: Record<string, number>;
  compras: Compra[];
}
interface CarritoAbandonado {
  session_id: string;
  tipo: "cuenta" | "anónimo";
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  item_count: number;
  total: number;
  items: { Id?: number | string; nombre?: string; cantidad?: number; precio?: number; tipo?: string }[];
  actualizado_en: string | null;
  creado_en: string | null;
}
interface Metricas {
  cuentas_total: number;
  cuentas_con_compra: number;
  cuentas_sin_compra: number;
  cuentas_sin_ningun_pedido: number;
  invitados_total: number;
  invitados_con_compra: number;
  ingresos_cuenta: number;
  pedidos_cuenta: number;
  ingresos_invitado: number;
  pedidos_invitado: number;
  ticket_promedio_cuenta: number;
  ticket_promedio_invitado: number;
  clientes_con_compra_total: number;
  tasa_conversion_cuentas: number;
  ingresos_totales: number;
  pedidos_pagados_total: number;
  ticket_promedio_global: number;
  clientes_recurrentes: number;
  carritos_abandonados_total: number;
  carritos_seguimiento_total: number;
  tasa_conversion_carritos: number;
  top_productos: { Id: number | string | null; nombre: string; unidades: number; ingresos: number }[];
  ingresos_por_mes: {
    mes: string;
    ingresos: number;
    pedidos: number;
    ingresos_cuenta: number;
    pedidos_cuenta: number;
    ingresos_invitado: number;
    pedidos_invitado: number;
  }[];
}
interface Payload {
  generado_en: string;
  metricas: Metricas;
  clientes: Cliente[];
  carritos_abandonados: CarritoAbandonado[];
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-green-100 text-green-800",
  configurado: "bg-blue-100 text-blue-800",
  modificado: "bg-orange-100 text-orange-800",
  rechazado: "bg-red-100 text-red-800",
  pagado: "bg-purple-100 text-purple-800",
  vencido: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-50 text-red-400",
};

function Kpi({
  label,
  value,
  sub,
  accent = "text-gray-800",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`text-2xl font-black ${accent}`}>{value}</div>
      <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">
        {label}
      </div>
      {sub && <div className="text-[11px] text-gray-400 font-medium mt-0.5">{sub}</div>}
    </div>
  );
}

function mesLabel(mes: string) {
  const [y, m] = mes.split("-");
  const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${nombres[Number(m) - 1] || m} ${String(y).slice(2)}`;
}

export default function ClientesTab() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<
    "clientes" | "abandonados" | "sin-compra" | "sin-cuenta"
  >("clientes");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "con-compra" | "sin-compra">("todos");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Estado del envío de recordatorio por cuenta (clave = email).
  const [mailState, setMailState] = useState<
    Record<string, "sending" | "sent" | "error">
  >({});
  const [enviandoTodos, setEnviandoTodos] = useState(false);

  const enviarRecordatorio = useCallback(
    async (email: string, nombre: string): Promise<boolean> => {
      setMailState((p) => ({ ...p, [email]: "sending" }));
      try {
        const res = await enviarRecordatorioSinCompra(email, nombre);
        setMailState((p) => ({ ...p, [email]: res.success ? "sent" : "error" }));
        if (!res.success) alert(res.error || "No se pudo enviar el email");
        return res.success;
      } catch {
        setMailState((p) => ({ ...p, [email]: "error" }));
        alert("No se pudo enviar el email");
        return false;
      }
    },
    [],
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchClientesAdmin();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando analítica de clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggle = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const clientesFiltrados = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.clientes.filter((c) => {
      if (filtro === "con-compra" && c.pedidos_pagados === 0) return false;
      if (filtro === "sin-compra" && c.pedidos_pagados > 0) return false;
      if (!q) return true;
      return (
        (c.nombre || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.telefono || "").toLowerCase().includes(q)
      );
    });
  }, [data, search, filtro]);

  const cuentasSinCompra = useMemo(
    () =>
      (data?.clientes || []).filter(
        (c) => c.tipo === "cuenta" && c.pedidos_pagados === 0,
      ),
    [data],
  );

  // Personas que compraron sin crear cuenta (invitados con al menos un pedido pagado).
  const comprasSinCuenta = useMemo(
    () =>
      (data?.clientes || [])
        .filter((c) => c.tipo === "invitado" && c.pedidos_pagados > 0)
        .sort((a, b) => b.total_gastado - a.total_gastado),
    [data],
  );

  // Solo a las que tienen email y todavía no recibieron el recordatorio en esta sesión.
  const cuentasConEmail = useMemo(
    () => cuentasSinCompra.filter((c) => c.email && mailState[c.email] !== "sent"),
    [cuentasSinCompra, mailState],
  );

  const enviarATodos = useCallback(async () => {
    if (
      !confirm(
        `Enviar el recordatorio con el descuento a ${cuentasConEmail.length} cuenta(s)?`,
      )
    )
      return;
    setEnviandoTodos(true);
    // Secuencial a propósito: no saturar Resend ni pegarle 50 requests juntas.
    for (const c of cuentasConEmail) {
      await enviarRecordatorio(c.email!, c.nombre);
    }
    setEnviandoTodos(false);
  }, [cuentasConEmail, enviarRecordatorio]);

  // --- Recordatorio de carrito abandonado (clave = session_id) ---
  const [cartMailState, setCartMailState] = useState<
    Record<string, "sending" | "sent" | "error">
  >({});
  const [enviandoCarritos, setEnviandoCarritos] = useState(false);

  const enviarRecordatorioCarrito = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setCartMailState((p) => ({ ...p, [sessionId]: "sending" }));
      try {
        const res = await enviarRecordatorioCarritoAbandonado(sessionId);
        setCartMailState((p) => ({
          ...p,
          [sessionId]: res.success ? "sent" : "error",
        }));
        if (!res.success) alert(res.error || "No se pudo enviar el email");
        return res.success;
      } catch {
        setCartMailState((p) => ({ ...p, [sessionId]: "error" }));
        alert("No se pudo enviar el email");
        return false;
      }
    },
    [],
  );

  const carritosConEmail = useMemo(
    () =>
      (data?.carritos_abandonados || []).filter(
        (c) => c.email && cartMailState[c.session_id] !== "sent",
      ),
    [data, cartMailState],
  );

  const enviarCarritosATodos = useCallback(async () => {
    if (
      !confirm(
        `Enviar el recordatorio de carrito a ${carritosConEmail.length} persona(s)?`,
      )
    )
      return;
    setEnviandoCarritos(true);
    // Secuencial a propósito: no saturar Resend.
    for (const c of carritosConEmail) {
      await enviarRecordatorioCarrito(c.session_id);
    }
    setEnviandoCarritos(false);
  }, [carritosConEmail, enviarRecordatorioCarrito]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
        <p className="font-bold text-gray-500">Calculando métricas de clientes…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-3"></i>
        <p className="font-bold text-red-600">{error || "Sin datos"}</p>
        <button
          onClick={cargar}
          className="mt-4 bg-[#FF6600] text-white px-5 py-2.5 rounded-xl font-black hover:bg-orange-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const m = data.metricas;
  const maxMes = Math.max(1, ...m.ingresos_por_mes.map((x) => x.ingresos));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
          <i className="fas fa-chart-pie text-[#FF6600]"></i>
          Clientes y métricas
        </h2>
        <button
          onClick={cargar}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition"
        >
          <i className="fas fa-sync-alt"></i>
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi label="Ingresos (pagado)" value={money(m.ingresos_totales)} accent="text-[#FF6600]" />
        <Kpi label="Pedidos pagados" value={m.pedidos_pagados_total} />
        <Kpi label="Ticket promedio" value={money(m.ticket_promedio_global)} />
        <Kpi
          label="Clientes que compraron"
          value={m.clientes_con_compra_total}
          sub={`${m.clientes_recurrentes} recurrentes`}
        />
        <Kpi
          label="Cuentas creadas"
          value={m.cuentas_total}
          sub={`${m.tasa_conversion_cuentas}% compró alguna vez`}
        />
        <Kpi
          label="Cuentas sin comprar"
          value={m.cuentas_sin_compra}
          accent="text-red-600"
          sub={`${m.cuentas_sin_ningun_pedido} sin ningún pedido`}
        />
      </div>

      {/* Con cuenta vs. sin cuenta */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi
          label="Ingresos con cuenta"
          value={money(m.ingresos_cuenta)}
          accent="text-[#FF6600]"
          sub={`${m.pedidos_cuenta} pedidos · ${
            m.ingresos_totales
              ? Math.round((m.ingresos_cuenta / m.ingresos_totales) * 100)
              : 0
          }%`}
        />
        <Kpi
          label="Ingresos sin cuenta"
          value={money(m.ingresos_invitado)}
          accent="text-sky-600"
          sub={`${m.pedidos_invitado} pedidos · ${
            m.ingresos_totales
              ? Math.round((m.ingresos_invitado / m.ingresos_totales) * 100)
              : 0
          }%`}
        />
        <Kpi
          label="Ticket prom. con cuenta"
          value={money(m.ticket_promedio_cuenta)}
        />
        <Kpi
          label="Ticket prom. sin cuenta"
          value={money(m.ticket_promedio_invitado)}
          accent="text-sky-600"
        />
        <Kpi
          label="Compradores sin cuenta"
          value={m.invitados_con_compra}
          accent="text-sky-600"
          sub={`${m.invitados_total} en total`}
        />
        <Kpi
          label="Compradores con cuenta"
          value={m.cuentas_con_compra}
          sub={`${m.cuentas_total} cuentas`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ingresos por mes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-700 text-sm uppercase tracking-wide">
              Ingresos por mes (pedidos pagados)
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6600]/80"></span>
                Con cuenta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/80"></span>
                Sin cuenta
              </span>
            </div>
          </div>
          {m.ingresos_por_mes.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium">Todavía no hay ventas pagadas.</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {m.ingresos_por_mes.map((x) => (
                <div key={x.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full">
                  <div className="text-[10px] font-bold text-gray-500">
                    {money(x.ingresos).replace("$", "")}
                  </div>
                  <div
                    className="flex-1 w-full flex flex-col justify-end"
                    title={
                      `${mesLabel(x.mes)} · ${money(x.ingresos)} (${x.pedidos} pedido/s)\n` +
                      `Con cuenta: ${money(x.ingresos_cuenta)} (${x.pedidos_cuenta})\n` +
                      `Sin cuenta: ${money(x.ingresos_invitado)} (${x.pedidos_invitado})`
                    }
                  >
                    <div
                      className="w-full bg-sky-500/80 hover:bg-sky-500 transition"
                      style={{ height: `${(x.ingresos_invitado / maxMes) * 100}%` }}
                    />
                    <div
                      className="w-full bg-[#FF6600]/80 rounded-t-md hover:bg-[#FF6600] transition"
                      style={{
                        height: `${(x.ingresos_cuenta / maxMes) * 100}%`,
                        minHeight: 4,
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 truncate w-full text-center">
                    {mesLabel(x.mes)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-700 text-sm uppercase tracking-wide mb-4">
            Productos más comprados
          </h3>
          {m.top_productos.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium">Sin datos todavía.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {m.top_productos.map((p, i) => (
                <div key={String(p.Id ?? p.nombre)} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right font-black text-gray-300">{i + 1}</span>
                  <span className="flex-1 font-bold text-gray-700 truncate">{p.nombre}</span>
                  <span className="font-bold text-gray-500">{p.unidades} u.</span>
                  <span className="w-24 text-right font-black text-[#FF6600]">
                    {money(p.ingresos)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub-navegación */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "clientes", label: `Clientes (${data.clientes.length})`, icon: "fa-users" },
          {
            id: "abandonados",
            label: `Carritos abandonados (${data.carritos_abandonados.length})`,
            icon: "fa-cart-arrow-down",
          },
          {
            id: "sin-compra",
            label: `Cuentas sin comprar (${cuentasSinCompra.length})`,
            icon: "fa-user-slash",
          },
          {
            id: "sin-cuenta",
            label: `Compraron sin cuenta (${comprasSinCuenta.length})`,
            icon: "fa-user-clock",
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id as typeof view)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
              view === t.id
                ? "bg-[#FF6600] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <i className={`fas ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- Vista: Clientes ---- */}
      {view === "clientes" && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium text-sm"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { id: "todos", label: "Todos" },
                { id: "con-compra", label: "Con compras" },
                { id: "sin-compra", label: "Sin compras" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id as typeof filtro)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filtro === f.id ? "bg-white shadow text-[#FF6600]" : "text-gray-500"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <i className="fas fa-users text-5xl mb-4"></i>
                <p className="font-bold text-lg">Sin resultados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="p-3 font-black">Cliente</th>
                      <th className="p-3 font-black">Tipo</th>
                      <th className="p-3 font-black text-center">Pedidos</th>
                      <th className="p-3 font-black text-center">Pagados</th>
                      <th className="p-3 font-black text-right">Gastado</th>
                      <th className="p-3 font-black text-right">Ticket prom.</th>
                      <th className="p-3 font-black">Última compra</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientesFiltrados.map((c) => (
                      <React.Fragment key={c.key}>
                        <tr
                          className="hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => toggle(c.key)}
                        >
                          <td className="p-3">
                            <div className="font-bold text-gray-800">{c.nombre}</div>
                            <div className="text-xs text-gray-400">
                              {c.email || c.telefono || "—"}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.tipo === "cuenta"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {c.tipo === "cuenta" ? "Cuenta" : "Invitado"}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-gray-700">
                            {c.pedidos_total}
                          </td>
                          <td className="p-3 text-center font-bold text-purple-700">
                            {c.pedidos_pagados}
                          </td>
                          <td className="p-3 text-right font-black text-[#FF6600]">
                            {money(c.total_gastado)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-600">
                            {c.pedidos_pagados ? money(c.ticket_promedio) : "—"}
                          </td>
                          <td className="p-3 text-gray-500">
                            {c.ultimo_pedido ? formatFechaCorta(c.ultimo_pedido) : "—"}
                          </td>
                          <td className="p-3 text-gray-400">
                            <i
                              className={`fas fa-chevron-${expanded[c.key] ? "up" : "down"}`}
                            ></i>
                          </td>
                        </tr>
                        {expanded[c.key] && (
                          <tr className="bg-gray-50/60">
                            <td colSpan={8} className="p-4">
                              <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-500 mb-3">
                                {c.registrado_en && (
                                  <span>
                                    <b className="text-gray-400 uppercase">Registro:</b>{" "}
                                    {formatFechaHora(c.registrado_en)}
                                  </span>
                                )}
                                {c.tipo_cliente && (
                                  <span>
                                    <b className="text-gray-400 uppercase">Tipo cliente:</b>{" "}
                                    {c.tipo_cliente}
                                  </span>
                                )}
                                {c.telefono && (
                                  <span>
                                    <b className="text-gray-400 uppercase">Tel:</b> {c.telefono}
                                  </span>
                                )}
                                {c.total_pendiente > 0 && (
                                  <span>
                                    <b className="text-gray-400 uppercase">En curso:</b>{" "}
                                    {money(c.total_pendiente)}
                                  </span>
                                )}
                              </div>

                              {c.compras.length === 0 ? (
                                <p className="text-sm text-gray-400 font-medium italic">
                                  Sin pedidos registrados.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {c.compras.map((compra) => (
                                    <div
                                      key={compra.id}
                                      className="bg-white rounded-xl border border-gray-200 p-3"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-gray-500">
                                            #{compra.id}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                              ESTADO_COLOR[compra.estado] ||
                                              "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {compra.estado}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {compra.fecha ? formatFechaHora(compra.fecha) : "—"}
                                          </span>
                                          {compra.fuente === "web" && (
                                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                              Web
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm font-black text-[#FF6600]">
                                          {money(compra.total)}
                                        </div>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <tbody>
                                            {compra.items.map((it, idx) => (
                                              <tr
                                                key={idx}
                                                className="border-t border-gray-100"
                                              >
                                                <td className="py-1 pr-2 font-medium text-gray-700">
                                                  {it.nombre}
                                                  <span className="ml-1 text-[10px] text-gray-400">
                                                    ({it.tipo})
                                                  </span>
                                                </td>
                                                <td className="py-1 px-2 text-center text-gray-500 whitespace-nowrap">
                                                  {it.cantidad} × {money(it.precio)}
                                                </td>
                                                <td className="py-1 pl-2 text-right font-bold text-gray-700 whitespace-nowrap">
                                                  {money(it.subtotal)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="text-[11px] text-gray-400 mt-1.5">
                                        {compra.metodo || "—"}
                                        {compra.metodo_pago ? ` · ${compra.metodo_pago}` : ""}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">
            {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ---- Vista: Carritos abandonados ---- */}
      {view === "abandonados" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Carritos con productos, sin pedido confirmado, sin actividad hace más de 2 h.
              El seguimiento empieza desde que se despliega esta versión —
              {" "}
              {m.tasa_conversion_carritos}% de {m.carritos_seguimiento_total} carritos registrados terminaron en compra.
            </span>
            {carritosConEmail.length > 0 && (
              <button
                onClick={enviarCarritosATodos}
                disabled={enviandoCarritos}
                className="bg-[#FF6600] hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition shrink-0"
              >
                <i className={`fas ${enviandoCarritos ? "fa-spinner fa-spin" : "fa-paper-plane"}`}></i>
                {enviandoCarritos
                  ? "Enviando…"
                  : `Enviar a todos (${carritosConEmail.length})`}
              </button>
            )}
          </div>
          {data.carritos_abandonados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fas fa-cart-arrow-down text-5xl mb-4"></i>
              <p className="font-bold text-lg">Ningún carrito abandonado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-3 font-black">Cliente</th>
                    <th className="p-3 font-black text-center">Ítems</th>
                    <th className="p-3 font-black text-right">Valor</th>
                    <th className="p-3 font-black">Última actividad</th>
                    <th className="p-3 font-black text-right">Recordatorio</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.carritos_abandonados.map((cart) => {
                    const st = cart.email
                      ? cartMailState[cart.session_id]
                      : undefined;
                    return (
                    <React.Fragment key={cart.session_id}>
                      <tr
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => toggle("cart:" + cart.session_id)}
                      >
                        <td className="p-3">
                          <div className="font-bold text-gray-800">
                            {cart.nombre || (cart.tipo === "cuenta" ? "Cuenta" : "Anónimo")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {cart.email || cart.telefono || cart.session_id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">
                          {cart.item_count}
                        </td>
                        <td className="p-3 text-right font-black text-[#FF6600]">
                          {money(cart.total)}
                        </td>
                        <td className="p-3 text-gray-500">
                          {cart.actualizado_en ? formatFechaHora(cart.actualizado_en) : "—"}
                        </td>
                        <td
                          className="p-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!cart.email ? (
                            <span className="text-xs text-gray-300">Sin email</span>
                          ) : st === "sent" ? (
                            <span className="text-xs font-bold text-green-600">
                              <i className="fas fa-check mr-1"></i>Enviado
                            </span>
                          ) : (
                            <button
                              onClick={() => enviarRecordatorioCarrito(cart.session_id)}
                              disabled={st === "sending"}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition ${
                                st === "error"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-orange-100 text-[#FF6600] hover:bg-orange-200"
                              } disabled:opacity-50`}
                            >
                              <i
                                className={`fas ${
                                  st === "sending"
                                    ? "fa-spinner fa-spin"
                                    : st === "error"
                                      ? "fa-rotate-right"
                                      : "fa-envelope"
                                }`}
                              ></i>
                              {st === "sending"
                                ? "Enviando…"
                                : st === "error"
                                  ? "Reintentar"
                                  : "Enviar email"}
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">
                          <i
                            className={`fas fa-chevron-${
                              expanded["cart:" + cart.session_id] ? "up" : "down"
                            }`}
                          ></i>
                        </td>
                      </tr>
                      {expanded["cart:" + cart.session_id] && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={6} className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <tbody>
                                  {cart.items.map((it, idx) => (
                                    <tr key={idx} className="border-t border-gray-100">
                                      <td className="py-1 pr-2 font-medium text-gray-700">
                                        {it.nombre || "Producto"}
                                        {it.tipo && (
                                          <span className="ml-1 text-[10px] text-gray-400">
                                            ({it.tipo})
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1 px-2 text-center text-gray-500 whitespace-nowrap">
                                        {it.cantidad ?? 1} × {money(Number(it.precio) || 0)}
                                      </td>
                                      <td className="py-1 pl-2 text-right font-bold text-gray-700 whitespace-nowrap">
                                        {money((Number(it.precio) || 0) * (Number(it.cantidad) || 0))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- Vista: Cuentas sin comprar ---- */}
      {view === "sin-compra" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Cuentas registradas que nunca tuvieron un pedido pagado. El email les
              recuerda el descuento de primera compra.
            </span>
            {cuentasConEmail.length > 0 && (
              <button
                onClick={enviarATodos}
                disabled={enviandoTodos}
                className="bg-[#FF6600] hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition"
              >
                <i className={`fas ${enviandoTodos ? "fa-spinner fa-spin" : "fa-paper-plane"}`}></i>
                {enviandoTodos
                  ? "Enviando…"
                  : `Enviar a todos (${cuentasConEmail.length})`}
              </button>
            )}
          </div>
          {cuentasSinCompra.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fas fa-user-check text-5xl mb-4"></i>
              <p className="font-bold text-lg">Todas las cuentas compraron al menos una vez</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-3 font-black">Nombre</th>
                    <th className="p-3 font-black">Email</th>
                    <th className="p-3 font-black">Teléfono</th>
                    <th className="p-3 font-black">Registro</th>
                    <th className="p-3 font-black text-center">Pedidos (sin pagar)</th>
                    <th className="p-3 font-black text-right">Recordatorio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cuentasSinCompra.map((c) => {
                    const st = c.email ? mailState[c.email] : undefined;
                    return (
                      <tr key={c.key} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-bold text-gray-800">{c.nombre}</td>
                        <td className="p-3 text-gray-600">{c.email || "—"}</td>
                        <td className="p-3 text-gray-600">{c.telefono || "—"}</td>
                        <td className="p-3 text-gray-500">
                          {c.registrado_en ? formatFechaCorta(c.registrado_en) : "—"}
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">
                          {c.pedidos_total}
                        </td>
                        <td className="p-3 text-right">
                          {!c.email ? (
                            <span className="text-xs text-gray-300">Sin email</span>
                          ) : st === "sent" ? (
                            <span className="text-xs font-bold text-green-600">
                              <i className="fas fa-check mr-1"></i>Enviado
                            </span>
                          ) : (
                            <button
                              onClick={() => enviarRecordatorio(c.email!, c.nombre)}
                              disabled={st === "sending"}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition ${
                                st === "error"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-orange-100 text-[#FF6600] hover:bg-orange-200"
                              } disabled:opacity-50`}
                            >
                              <i
                                className={`fas ${
                                  st === "sending"
                                    ? "fa-spinner fa-spin"
                                    : st === "error"
                                      ? "fa-rotate-right"
                                      : "fa-envelope"
                                }`}
                              ></i>
                              {st === "sending"
                                ? "Enviando…"
                                : st === "error"
                                  ? "Reintentar"
                                  : "Enviar email"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- Vista: Compraron sin cuenta ---- */}
      {view === "sin-cuenta" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
            Personas con al menos un pedido pagado que nunca crearon una cuenta
            (checkout como invitado). Se agrupan por teléfono.
          </div>
          {comprasSinCuenta.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fas fa-user-clock text-5xl mb-4"></i>
              <p className="font-bold text-lg">Todavía nadie compró sin cuenta</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-3 font-black">Cliente</th>
                    <th className="p-3 font-black">Teléfono</th>
                    <th className="p-3 font-black text-center">Pedidos pagados</th>
                    <th className="p-3 font-black text-right">Gastado</th>
                    <th className="p-3 font-black text-right">Ticket prom.</th>
                    <th className="p-3 font-black">Primera compra</th>
                    <th className="p-3 font-black">Última compra</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comprasSinCuenta.map((c) => (
                    <React.Fragment key={c.key}>
                      <tr
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => toggle(c.key)}
                      >
                        <td className="p-3 font-bold text-gray-800">{c.nombre}</td>
                        <td className="p-3 text-gray-600">{c.telefono || "—"}</td>
                        <td className="p-3 text-center font-bold text-purple-700">
                          {c.pedidos_pagados}
                        </td>
                        <td className="p-3 text-right font-black text-[#FF6600]">
                          {money(c.total_gastado)}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-600">
                          {c.pedidos_pagados ? money(c.ticket_promedio) : "—"}
                        </td>
                        <td className="p-3 text-gray-500">
                          {c.primer_pedido ? formatFechaCorta(c.primer_pedido) : "—"}
                        </td>
                        <td className="p-3 text-gray-500">
                          {c.ultimo_pedido ? formatFechaCorta(c.ultimo_pedido) : "—"}
                        </td>
                        <td className="p-3 text-gray-400">
                          <i className={`fas fa-chevron-${expanded[c.key] ? "up" : "down"}`}></i>
                        </td>
                      </tr>
                      {expanded[c.key] && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={8} className="p-4">
                            {c.compras.length === 0 ? (
                              <p className="text-sm text-gray-400 font-medium italic">
                                Sin pedidos registrados.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {c.compras.map((compra) => (
                                  <div
                                    key={compra.id}
                                    className="bg-white rounded-xl border border-gray-200 p-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-gray-500">
                                          #{compra.id}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            ESTADO_COLOR[compra.estado] ||
                                            "bg-gray-100 text-gray-600"
                                          }`}
                                        >
                                          {compra.estado}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {compra.fecha ? formatFechaHora(compra.fecha) : "—"}
                                        </span>
                                      </div>
                                      <div className="text-sm font-black text-[#FF6600]">
                                        {money(compra.total)}
                                      </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <tbody>
                                          {compra.items.map((it, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                              <td className="py-1 pr-2 font-medium text-gray-700">
                                                {it.nombre}
                                                <span className="ml-1 text-[10px] text-gray-400">
                                                  ({it.tipo})
                                                </span>
                                              </td>
                                              <td className="py-1 px-2 text-center text-gray-500 whitespace-nowrap">
                                                {it.cantidad} × {money(it.precio)}
                                              </td>
                                              <td className="py-1 pl-2 text-right font-bold text-gray-700 whitespace-nowrap">
                                                {money(it.subtotal)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-gray-300 mt-6">
        Generado {formatFechaHora(data.generado_en)}
      </p>
    </div>
  );
}
