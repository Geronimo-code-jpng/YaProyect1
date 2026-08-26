"use client";

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { fetchConfiguracion, fetchPedidosByUserId } from "../lib/catalogApi";
import { formatFechaHora } from "../utils/formatFechaHora";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

function CountdownTimer({ expira_en = "" }: { expira_en?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const diff = Number(new Date(expira_en)) - Number(new Date());
      if (diff > 0) {
        setTimeLeft({
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expira_en]);

  if (!timeLeft) return <span className="text-red-600 font-bold">Vencido</span>;

  return (
    <span className="text-blue-600 font-bold">
      {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, "0")}
    </span>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { showError } = useAlert();
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingPrice, setShippingPrice] = useState(7300);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [activeFilter, setActiveFilter] = useState("todos");
  const [bancoInfo, setBancoInfo] = useState({ banco: "", titular: "", alias: "", cbu: "" });

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfiguracion();
        if (data) {
          if (data.precio_envio) setShippingPrice(data.precio_envio);
          setBancoInfo({
            banco: data.banco || "",
            titular: data.titular || "",
            alias: data.alias || "",
            cbu: data.cbu || "",
          });
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
      }
    };
    loadConfig();
  }, []);

  const cargarPedidos = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = user?.id ? await fetchPedidosByUserId(user.id) : [];

      const pedidosArray = Array.isArray(data) ? data : [];

      const pedidosConNumero = pedidosArray.map((pedido, index) => ({
        ...pedido,
        numeroPedidoUsuario: pedidosArray.length - index,
      }));

      setPedidos(pedidosConNumero);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      showError("Error cargando pedidos");
    } finally {
      setIsLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    if (user) {
      cargarPedidos();
    } else {
      setIsLoading(false);
    }
  }, [user, cargarPedidos]);

  const getStatusBadge = (estado) => {
    const badges = {
      pagado: { bg: "bg-blue-100", text: "text-blue-800", label: "Pagado", icon: CheckCircle },
      aprobado: { bg: "bg-green-100", text: "text-green-800", label: "Aprobado", icon: CheckCircle },
      configurado: { bg: "bg-blue-100", text: "text-blue-800", label: "Pendiente de pago", icon: Clock },
      pendiente: { bg: "bg-gray-100", text: "text-gray-800", label: "Pendiente", icon: Clock },
      rechazado: { bg: "bg-red-100", text: "text-red-800", label: "Rechazado", icon: XCircle },
      modificado: { bg: "bg-orange-100", text: "text-orange-800", label: "Modificado", icon: AlertTriangle },
      vencido: { bg: "bg-red-100", text: "text-red-800", label: "Vencido", icon: XCircle },
      cancelado: { bg: "bg-gray-200", text: "text-gray-600", label: "Cancelado", icon: XCircle },
    };
    return badges[estado] || badges.pendiente;
  };

  const pedidosFiltrados =
    activeFilter === "todos"
      ? pedidos
      : pedidos.filter((p) => p.estado === activeFilter);

  const stats = {
    total: pedidos.length,
    pagados: pedidos.filter((p) => p.estado === "pagado").length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente" || p.estado === "configurado").length,
    totalGastado: pedidos
      .filter((p) => p.estado === "pagado")
      .reduce((sum, p) => sum + Number(p.total || 0), 0),
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-md mx-auto text-center px-4">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-gray-900 mb-4">Mis Pedidos</h2>
          <p className="text-gray-600 mb-8">Iniciá sesión para ver tus pedidos</p>
          <Link
            href="/login"
            className="inline-block bg-[#FF6600] text-white px-8 py-4 rounded-xl font-black hover:bg-orange-700 transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
                <Package className="text-[#FF6600]" />
                Mis Pedidos
              </h1>
              <p className="text-gray-600 mt-1">
                Historial y estado de tus compras
              </p>
            </div>
            <button
              onClick={cargarPedidos}
              className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#FF6600]" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
            <p className="text-sm font-medium text-gray-500">Total pedidos</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.pendientes}</p>
            <p className="text-sm font-medium text-gray-500">Pendientes</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.pagados}</p>
            <p className="text-sm font-medium text-gray-500">Completados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "todos", label: "Todos", color: "bg-gray-100 text-gray-700" },
            { key: "pendiente", label: "Pendientes", color: "bg-yellow-100 text-yellow-700" },
            { key: "configurado", label: "Por pagar", color: "bg-blue-100 text-blue-700" },
            { key: "pagado", label: "Pagados", color: "bg-green-100 text-green-700" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 m-0.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeFilter === key
                  ? `${color} ring-2 ring-[#FF6600]`
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-500">Cargando pedidos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {activeFilter === "todos"
                ? "No tienes pedidos aún"
                : "No hay pedidos con este estado"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeFilter === "todos"
                ? "Explorá nuestros productos y hacé tu primer pedido"
                : ""}
            </p>
            <Link
              href="/productos"
              className="inline-block bg-[#FF6600] text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => {
              const statusBadge = getStatusBadge(pedido.estado);
              let carritoArray = [];
              if (typeof pedido.carrito === "string") {
                try { carritoArray = JSON.parse(pedido.carrito); } catch { carritoArray = []; }
              } else if (Array.isArray(pedido.carrito)) {
                carritoArray = pedido.carrito;
              }

              const subtotal = carritoArray.reduce(
                (total, item) => total + (item.precio_unitario || item.precio || 0) * item.cantidad, 0
              );
              const envioCosto = pedido.metodo === "retiro" ? 0 : shippingPrice;
              const totalFinal = subtotal + envioCosto;

              const tiempoExpirado = pedido.estado === "configurado" && pedido.expira_en
                ? new Date(pedido.expira_en) <= new Date()
                : false;

              return (
                <div
                  key={pedido.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FF6600]/10 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-[#FF6600]" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg">
                          Pedido #{pedido.numeroPedidoUsuario}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: #{pedido.id} · {formatFechaHora(pedido.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-black ${statusBadge.bg} ${statusBadge.text} flex items-center gap-1.5`}
                      >
                        {statusBadge.label}
                      </span>
                      <span className="text-2xl font-black text-[#FF6600]">
                        ${Number(pedido.total).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-5">
                    {/* Payment Section */}
                    {pedido.estado === "configurado" && pedido.metodo_pago === "transferencia" && (
                      <>
                        {pedido.expira_en && !tiempoExpirado && (
                          <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                <CreditCard size={18} />
                                Pendiente de pago
                              </h4>
                              <CountdownTimer expira_en={pedido.expira_en} />
                            </div>
                            <div className="space-y-2 mb-3 text-sm">
                              {bancoInfo.banco && <p className="text-purple-900"><span className="font-bold">Banco:</span> {bancoInfo.banco}</p>}
                              {bancoInfo.titular && <p className="text-purple-900"><span className="font-bold">Titular:</span> {bancoInfo.titular}</p>}
                              <p className="text-purple-900">
                                <span className="font-bold">Alias:</span>{" "}
                                <span className="text-base font-black">{bancoInfo.alias || "Consultar al local"}</span>
                              </p>
                              {bancoInfo.cbu && <p className="text-purple-900"><span className="font-bold">CBU:</span> {bancoInfo.cbu}</p>}
                            </div>
                            <a
                              href={`https://wa.me/549${pedido.telefono?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola, adjunto comprobante de pago del pedido #${pedido.id}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                            >
                              <i className="fab fa-whatsapp mr-2"></i>
                              Enviar comprobante por WhatsApp
                            </a>
                          </div>
                        )}
                        {tiempoExpirado && (
                          <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
                            <h4 className="font-bold text-red-800 flex items-center gap-2">
                              <XCircle size={18} />
                              Tiempo de pago expirado
                            </h4>
                            <p className="text-sm text-red-700 mt-1">
                              El tiempo para pagar finalizó. Contactanos para reactivar tu pedido.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {pedido.estado === "configurado" && pedido.metodo_pago === "efectivo" && (
                      <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                        <h4 className="font-bold text-green-800 flex items-center gap-2">
                          <CheckCircle size={18} />
                          {pedido.metodo === "retiro" ? "Pagás al retirar en el local" : "Pagás al recibir el pedido"}
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          {pedido.metodo === "retiro"
                            ? "Pasá por nuestro local a retirar y aboná en efectivo. Te esperamos!"
                            : "Cuando recibas tu pedido, abonás en efectivo al repartidor."}
                        </p>
                      </div>
                    )}

                    {pedido.estado === "configurado" && !pedido.metodo_pago && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                          <Clock size={18} />
                          Pedido aceptado
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Tu pedido fue aceptado. Te vamos a notificar cuando esté listo.
                        </p>
                      </div>
                    )}

                    {/* Products List */}
                    <div className="space-y-3">
                      {carritoArray.slice(0, expandedOrders[pedido.id] ? undefined : 3).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {item.nombre}
                              </span>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                                  (item.tipo || "Bulto") === "Bulto"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {item.tipo || "Bulto"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              x{item.cantidad} · ${(item.precio_unitario || item.precio || 0).toLocaleString("es-AR")} c/u
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900">
                              ${((item.precio_unitario || item.precio || 0) * item.cantidad).toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      ))}
                      {carritoArray.length > 3 && (
                        <button
                          onClick={() => toggleExpand(pedido.id)}
                          className="w-full text-sm font-bold text-[#FF6600] hover:text-orange-700 transition py-2 flex items-center justify-center gap-1"
                        >
                          {expandedOrders[pedido.id]
                            ? "Mostrar menos"
                            : `Ver ${carritoArray.length - 3} productos más`}
                        </button>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${subtotal.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {pedido.metodo === "retiro" ? "Retiro en local" : "Envío"}
                        </span>
                        <span className="font-medium">
                          {pedido.metodo === "retiro" ? "Gratis" : `$${envioCosto.toLocaleString("es-AR")}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t">
                        <span>Total</span>
                        <span className="text-[#FF6600]">
                          ${totalFinal.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        📍 {pedido.direccion || "Sin dirección"}
                      </span>
                      {pedido.notas && (
                        <span className="flex items-center gap-1">
                          📝 {pedido.notas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
