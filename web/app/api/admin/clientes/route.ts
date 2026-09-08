import { db } from "@/db/client";
import { perfiles, pedidos, carrito_actividad } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { acumularVentas } from "@/lib/ventasPorProducto";

// Estados que cuentan como venta concretada / ingreso real.
const ESTADOS_PAGADOS = new Set(["pagado"]);
// Estados que NO representan intención de compra viva (se ignoran para "gastado").
const ESTADOS_MUERTOS = new Set(["rechazado", "cancelado", "vencido"]);

const HORAS_ABANDONO = 2;

type CartItem = {
  Id?: number | string;
  nombre?: string;
  cantidad?: number;
  precio?: number;
  precio_unitario?: number;
  subtotal?: number;
  tipo?: string;
};

function normTel(t?: string | null): string {
  if (!t) return "";
  let d = String(t).replace(/\D/g, "");
  d = d.replace(/^0/, "");
  d = d.replace(/^549?/, ""); // prefijo AR celular
  return d;
}

function parseCarrito(raw: unknown): CartItem[] {
  if (Array.isArray(raw)) return raw as CartItem[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function itemUnit(it: CartItem): number {
  return Number(it.precio_unitario ?? it.precio ?? 0) || 0;
}

export async function GET() {
  const [perfilesRows, pedidosRows, carritosRows] = await Promise.all([
    db.select().from(perfiles),
    db.select().from(pedidos),
    db.select().from(carrito_actividad),
  ]);

  // --- Índices de perfiles -------------------------------------------------
  const perfilById = new Map<string, (typeof perfilesRows)[number]>();
  const perfilByTel = new Map<string, (typeof perfilesRows)[number]>();
  for (const p of perfilesRows) {
    perfilById.set(p.id, p);
    const t = normTel(p.telefono);
    if (t && !perfilByTel.has(t)) perfilByTel.set(t, p);
  }

  // --- Agrupar pedidos por cliente --------------------------------------
  type Compra = {
    id: number;
    fecha: string | null;
    estado: string;
    total: number;
    metodo: string | null;
    metodo_pago: string | null;
    fuente: string | null;
    items: {
      Id: number | string | null;
      nombre: string;
      cantidad: number;
      precio: number;
      subtotal: number;
      tipo: string;
    }[];
  };

  type Cliente = {
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
  };

  const clientes = new Map<string, Cliente>();

  function clienteDePerfil(p: (typeof perfilesRows)[number]): Cliente {
    const key = `cuenta:${p.id}`;
    let c = clientes.get(key);
    if (!c) {
      c = {
        key,
        tipo: "cuenta",
        perfil_id: p.id,
        nombre: p.nombre || "—",
        email: p.email || null,
        telefono: p.telefono || null,
        tipo_cliente: p.tipo_cliente || null,
        rol: p.rol || null,
        registrado_en: (p as { created_at?: string | null }).created_at ?? null,
        pedidos_total: 0,
        pedidos_pagados: 0,
        total_gastado: 0,
        total_pendiente: 0,
        ticket_promedio: 0,
        primer_pedido: null,
        ultimo_pedido: null,
        estados: {},
        compras: [],
      };
      clientes.set(key, c);
    }
    return c;
  }

  // Pre-crear una entrada por cada cuenta (así aparecen las que nunca compraron).
  for (const p of perfilesRows) {
    if (p.rol === "admin") continue;
    clienteDePerfil(p);
  }

  const ingresosPorMes = new Map<
    string,
    {
      ingresos: number;
      pedidos: number;
      ingresos_cuenta: number;
      pedidos_cuenta: number;
      ingresos_invitado: number;
      pedidos_invitado: number;
    }
  >();

  for (const ped of pedidosRows) {
    const tel = normTel(ped.telefono);
    let c: Cliente;

    const perfilPorId =
      ped.user_id && perfilById.has(ped.user_id)
        ? perfilById.get(ped.user_id)!
        : null;
    const perfilPorTel = !perfilPorId && tel ? perfilByTel.get(tel) : null;

    if (perfilPorId) {
      c = clienteDePerfil(perfilPorId);
    } else if (perfilPorTel) {
      c = clienteDePerfil(perfilPorTel);
    } else {
      const key = tel ? `tel:${tel}` : `pedido:${ped.id}`;
      c = clientes.get(key) ?? {
        key,
        tipo: "invitado",
        perfil_id: null,
        nombre: ped.nombre_cliente || "Invitado",
        email: null,
        telefono: ped.telefono || null,
        tipo_cliente: null,
        rol: null,
        registrado_en: null,
        pedidos_total: 0,
        pedidos_pagados: 0,
        total_gastado: 0,
        total_pendiente: 0,
        ticket_promedio: 0,
        primer_pedido: null,
        ultimo_pedido: null,
        estados: {},
        compras: [],
      };
      clientes.set(key, c);
    }

    const estado = ped.estado || "pendiente";
    const total = Number(ped.total) || 0;
    const items = parseCarrito(ped.carrito)
      .filter((it) => (Number(it.cantidad) || 0) > 0)
      .map((it) => {
        const cantidad = Number(it.cantidad) || 0;
        const precio = itemUnit(it);
        return {
          Id: it.Id ?? null,
          nombre: it.nombre || "Producto",
          cantidad,
          precio,
          subtotal: Number(it.subtotal ?? precio * cantidad) || 0,
          tipo: it.tipo || "Bulto",
        };
      });

    c.pedidos_total += 1;
    c.estados[estado] = (c.estados[estado] || 0) + 1;

    const fecha = ped.created_at ?? null;
    if (fecha) {
      if (!c.primer_pedido || fecha < c.primer_pedido) c.primer_pedido = fecha;
      if (!c.ultimo_pedido || fecha > c.ultimo_pedido) c.ultimo_pedido = fecha;
    }

    if (ESTADOS_PAGADOS.has(estado)) {
      c.pedidos_pagados += 1;
      c.total_gastado += total;

      const mes = (fecha || "").slice(0, 7);
      if (mes) {
        const m =
          ingresosPorMes.get(mes) || {
            ingresos: 0,
            pedidos: 0,
            ingresos_cuenta: 0,
            pedidos_cuenta: 0,
            ingresos_invitado: 0,
            pedidos_invitado: 0,
          };
        m.ingresos += total;
        m.pedidos += 1;
        if (c.tipo === "cuenta") {
          m.ingresos_cuenta += total;
          m.pedidos_cuenta += 1;
        } else {
          m.ingresos_invitado += total;
          m.pedidos_invitado += 1;
        }
        ingresosPorMes.set(mes, m);
      }
    } else if (!ESTADOS_MUERTOS.has(estado)) {
      c.total_pendiente += total;
    }

    c.compras.push({
      id: ped.id,
      fecha,
      estado,
      total,
      metodo: ped.metodo ?? null,
      metodo_pago: ped.metodo_pago ?? null,
      fuente: ped.fuente ?? null,
      items,
    });
  }

  const clientesArr = [...clientes.values()].map((c) => {
    c.compras.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    c.ticket_promedio = c.pedidos_pagados
      ? Math.round(c.total_gastado / c.pedidos_pagados)
      : 0;
    return c;
  });
  clientesArr.sort((a, b) => b.total_gastado - a.total_gastado);

  // --- Carritos abandonados ------------------------------------------------
  const corte = Date.now() - HORAS_ABANDONO * 3600 * 1000;
  const carritosAbandonados = carritosRows
    .filter(
      (r) =>
        !r.convertido &&
        (r.item_count || 0) > 0 &&
        r.updated_at != null &&
        new Date(r.updated_at).getTime() < corte,
    )
    .map((r) => {
      const perfil = r.user_id ? perfilById.get(r.user_id) : undefined;
      return {
        session_id: r.session_id,
        tipo: (r.user_id ? "cuenta" : "anónimo") as "cuenta" | "anónimo",
        nombre: perfil?.nombre || r.nombre || null,
        email: perfil?.email || r.email || null,
        telefono: perfil?.telefono || r.telefono || null,
        item_count: r.item_count || 0,
        total: Number(r.total) || 0,
        items: Array.isArray(r.items) ? r.items : [],
        actualizado_en: r.updated_at,
        creado_en: r.created_at,
      };
    })
    .sort((a, b) => (b.actualizado_en || "").localeCompare(a.actualizado_en || ""));

  // --- Métricas agregadas ------------------------------------------------
  const cuentas = clientesArr.filter((c) => c.tipo === "cuenta");
  const invitados = clientesArr.filter((c) => c.tipo === "invitado");
  const cuentasConCompra = cuentas.filter((c) => c.pedidos_pagados > 0);
  const cuentasSinNingunPedido = cuentas.filter((c) => c.pedidos_total === 0);
  const clientesConCompra = clientesArr.filter((c) => c.pedidos_pagados > 0);
  const recurrentes = clientesArr.filter((c) => c.pedidos_pagados >= 2);

  const ingresosTotales = clientesConCompra.reduce(
    (s, c) => s + c.total_gastado,
    0,
  );
  const pedidosPagadosTotal = clientesConCompra.reduce(
    (s, c) => s + c.pedidos_pagados,
    0,
  );

  // Desglose cuenta vs. sin cuenta (invitado).
  const ingresosCuenta = cuentas.reduce((s, c) => s + c.total_gastado, 0);
  const pedidosCuenta = cuentas.reduce((s, c) => s + c.pedidos_pagados, 0);
  const ingresosInvitado = invitados.reduce((s, c) => s + c.total_gastado, 0);
  const pedidosInvitado = invitados.reduce((s, c) => s + c.pedidos_pagados, 0);
  const invitadosConCompra = invitados.filter((c) => c.pedidos_pagados > 0);

  const totalCarritos = carritosRows.filter((r) => (r.item_count || 0) > 0).length;
  const carritosConvertidos = carritosRows.filter(
    (r) => r.convertido && (r.item_count || 0) > 0,
  ).length;

  const metricas = {
    cuentas_total: cuentas.length,
    cuentas_con_compra: cuentasConCompra.length,
    cuentas_sin_compra: cuentas.length - cuentasConCompra.length,
    cuentas_sin_ningun_pedido: cuentasSinNingunPedido.length,
    invitados_total: invitados.length,
    invitados_con_compra: invitadosConCompra.length,
    ingresos_cuenta: ingresosCuenta,
    pedidos_cuenta: pedidosCuenta,
    ingresos_invitado: ingresosInvitado,
    pedidos_invitado: pedidosInvitado,
    ticket_promedio_cuenta: pedidosCuenta
      ? Math.round(ingresosCuenta / pedidosCuenta)
      : 0,
    ticket_promedio_invitado: pedidosInvitado
      ? Math.round(ingresosInvitado / pedidosInvitado)
      : 0,
    clientes_con_compra_total: clientesConCompra.length,
    tasa_conversion_cuentas: cuentas.length
      ? Math.round((cuentasConCompra.length / cuentas.length) * 100)
      : 0,
    ingresos_totales: ingresosTotales,
    pedidos_pagados_total: pedidosPagadosTotal,
    ticket_promedio_global: pedidosPagadosTotal
      ? Math.round(ingresosTotales / pedidosPagadosTotal)
      : 0,
    clientes_recurrentes: recurrentes.length,
    carritos_abandonados_total: carritosAbandonados.length,
    carritos_seguimiento_total: totalCarritos,
    tasa_conversion_carritos:
      totalCarritos > 0
        ? Math.round((carritosConvertidos / totalCarritos) * 100)
        : 0,
    top_productos: [...acumularVentas(pedidosRows).values()]
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 15),
    ingresos_por_mes: [...ingresosPorMes.entries()]
      .map(([mes, v]) => ({ mes, ...v }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12),
  };

  return jsonCors({
    generado_en: new Date().toISOString(),
    metricas,
    clientes: clientesArr,
    carritos_abandonados: carritosAbandonados,
  });
}
