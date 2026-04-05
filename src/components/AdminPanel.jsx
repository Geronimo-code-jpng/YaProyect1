import { useState, useEffect, useRef, useCallback } from "react";
import { supabaseClient } from "../db/supabeClient";
import { useNavigate } from "react-router-dom";

// Componente de confirmación inline (reemplaza alert/confirm nativos)
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <p className="text-gray-800 font-bold text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-black rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast de notificación inline
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] ${colors[type] || colors.info} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold`}
    >
      <i
        className={`fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-times-circle" : "fa-info-circle"} text-xl`}
      ></i>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const timerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };

  // Cargar pedidos (con useCallback para evitar re-renders)
  const cargarPedidosAdmin = useCallback(async () => {
    try {
      const { data: todosLosPedidos, error } = await supabaseClient
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando pedidos admin:", error);
        if (error.message?.includes("pedidos_web")) {
          setError(
            "Error de configuración de base de datos. Contactá al administrador.",
          );
        } else {
          setError("Error cargando pedidos: " + error.message);
        }
        setPedidos([]);
        return;
      }

      const pedidosProcesados = (todosLosPedidos || []).map((pedido) => ({
        ...pedido,
        carrito: Array.isArray(pedido.carrito)
          ? pedido.carrito
          : (() => {
              try {
                return JSON.parse(pedido.carrito || "[]");
              } catch {
                return [];
              }
            })(),
        total: Number(pedido.total) || 0,
        nombre_cliente: pedido.nombre_cliente || pedido.nombre || "Sin nombre",
        telefono: pedido.telefono || "Sin teléfono",
        direccion: pedido.direccion || "Sin dirección",
        metodo: pedido.metodo || pedido.metodo_entrega || "envio",
      }));

      setPedidos(pedidosProcesados);
      setError(null);
    } catch (err) {
      console.error("Error general cargando pedidos:", err);
      setError("Error crítico cargando pedidos: " + err.message);
      setPedidos([]);
    }
  }, []);

  // Verificar autenticación y rol de admin
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { data, error: sessionError } =
          await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;

        const session = data.session;
        if (!session) {
          navigate("/");
          return;
        }

        setCurrentUser(session.user);

        const { data: perfil, error: perfilError } = await supabaseClient
          .from("perfiles")
          .select("rol")
          .eq("id", session.user.id)
          .single();

        if (perfilError) {
          setError("Error de permisos: " + perfilError.message);
          setLoading(false);
          return;
        }

        if (!perfil || perfil.rol !== "admin") {
          navigate("/");
          return;
        }

        setLoading(false);
        cargarPedidosAdmin();
      } catch (err) {
        setError("Error crítico: " + err.message);
        setLoading(false);
      }
    };

    verificarAdmin();
  }, [navigate, cargarPedidosAdmin]);

  // Timer de refresco cada 30 segundos — usando ref para evitar re-renders
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      cargarPedidosAdmin();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, cargarPedidosAdmin]);

  // Verificar pedidos vencidos cada minuto
  useEffect(() => {
    const verificarVencidos = async () => {
      try {
        const { data: pedidosConfigurados, error } = await supabaseClient
          .from("pedidos")
          .select("id, expira_en")
          .eq("estado", "configurado");

        if (error) throw error;

        const ahora = new Date();
        for (const pedido of pedidosConfigurados || []) {
          if (new Date(pedido.expira_en) < ahora) {
            await supabaseClient
              .from("pedidos")
              .update({ estado: "vencido" })
              .eq("id", pedido.id);
          }
        }

        cargarPedidosAdmin();
      } catch (err) {
        console.error("Error verificando pedidos vencidos:", err);
      }
    };

    const interval = setInterval(verificarVencidos, 60000);
    return () => clearInterval(interval);
  }, [cargarPedidosAdmin]);

  const calcularTiempoRestante = (fechaVencimiento) => {
    const diferencia = new Date(fechaVencimiento) - new Date();
    return Math.max(0, Math.floor(diferencia / 1000));
  };

  const configurarPedido = (idPedido) => {
    showConfirm(
      `¿Configurar pedido #${idPedido}? Se iniciarán 10 minutos para pagar.`,
      async () => {
        setConfirm(null);
        try {
          const fechaVencimiento = new Date(Date.now() + 10 * 60 * 1000);
          const { error } = await supabaseClient
            .from("pedidos")
            .update({
              estado: "configurado",
              expira_en: fechaVencimiento.toISOString(),
            })
            .eq("id", idPedido);

          if (error) throw error;
          showToast(
            `✅ Pedido #${idPedido} configurado. 10 minutos para pagar.`,
          );
          cargarPedidosAdmin();
        } catch (err) {
          showToast("Error al configurar el pedido: " + err.message, "error");
        }
      },
    );
  };

  const marcarPagado = (idPedido) => {
    showConfirm(`¿Confirmar pago del pedido #${idPedido}?`, async () => {
      setConfirm(null);
      try {
        // Obtener datos del pedido antes de actualizar
        const { data: pedido, error: fetchError } = await supabaseClient
          .from("pedidos")
          .select("*")
          .eq("id", idPedido)
          .single();

        if (fetchError) throw fetchError;

        const { error } = await supabaseClient
          .from("pedidos")
          .update({ estado: "pagado" })
          .eq("id", idPedido);

        if (error) throw error;
        
        // Enviar WhatsApp de confirmación
        await enviarWhatsAppConfirmacion(pedido);
        
        showToast(`✅ Pedido #${idPedido} marcado como pagado y notificado.`);
        cargarPedidosAdmin();
      } catch (err) {
        showToast("Error al marcar como pagado: " + err.message, "error");
      }
    });
  };

  const cambiarEstado = (idPedido, nuevoEstado) => {
    showConfirm(
      `¿Marcar pedido #${idPedido} como ${nuevoEstado.toUpperCase()}?`,
      async () => {
        setConfirm(null);
        try {
          const { error } = await supabaseClient
            .from("pedidos")
            .update({ estado: nuevoEstado })
            .eq("id", idPedido);

          if (error) throw error;
          showToast(`¡Pedido ${nuevoEstado} con éxito!`);
          cargarPedidosAdmin();
        } catch (err) {
          showToast("Error al cambiar el estado: " + err.message, "error");
        }
      },
    );
  };

  const abrirModalModificar = (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) {
      showToast("Pedido no encontrado", "error");
      return;
    }

    let pedidoCopia = JSON.parse(JSON.stringify(pedido));

    if (typeof pedidoCopia.carrito === "string") {
      try {
        pedidoCopia.carrito = JSON.parse(pedidoCopia.carrito);
      } catch {
        pedidoCopia.carrito = [];
      }
    }
    if (!Array.isArray(pedidoCopia.carrito)) pedidoCopia.carrito = [];

    pedidoCopia.carrito.forEach((item) => {
      if (item.cantidad_original === undefined)
        item.cantidad_original = item.cantidad;
    });

    setPedidoEditando(pedidoCopia);
    setModalOpen(true);
  };

  const cerrarModalPedido = () => {
    setModalOpen(false);
    setPedidoEditando(null);
  };

  const cambiarCantidadModal = (index, cambio) => {
    const nuevaCantidad = pedidoEditando.carrito[index].cantidad + cambio;
    if (nuevaCantidad < 0) return;

    const nuevoPedido = { ...pedidoEditando };
    nuevoPedido.carrito = [...nuevoPedido.carrito];
    nuevoPedido.carrito[index] = {
      ...nuevoPedido.carrito[index],
      cantidad: nuevaCantidad,
    };
    nuevoPedido.total = nuevoPedido.carrito.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0,
    );
    setPedidoEditando(nuevoPedido);
  };

  const eliminarDelModal = (index) => {
    const nuevoPedido = { ...pedidoEditando };
    nuevoPedido.carrito = [...nuevoPedido.carrito];
    nuevoPedido.carrito[index] = { ...nuevoPedido.carrito[index], cantidad: 0 };
    nuevoPedido.total = nuevoPedido.carrito.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0,
    );
    setPedidoEditando(nuevoPedido);
  };

  const guardarModificacionPedido = async () => {
    try {
      const { data: pedidoOriginal, error: errorOriginal } =
        await supabaseClient
          .from("pedidos")
          .select("*")
          .eq("id", pedidoEditando.id)
          .single();

      if (errorOriginal) throw errorOriginal;

      const carritoParaGuardar = Array.isArray(pedidoEditando.carrito)
        ? pedidoEditando.carrito
        : JSON.parse(pedidoEditando.carrito || "[]");

      const { error } = await supabaseClient
        .from("pedidos")
        .update({
          carrito: carritoParaGuardar,
          total: pedidoEditando.total,
          estado: "modificado",
        })
        .eq("id", pedidoEditando.id);

      if (error) throw error;

      // Abrir WhatsApp con el mensaje de modificación
      await enviarWhatsAppModificacion(pedidoEditando, pedidoOriginal);

      showToast(
        "Pedido modificado. Se abrirá WhatsApp para notificar al cliente.",
      );
      cerrarModalPedido();
      cargarPedidosAdmin();
    } catch (err) {
      showToast("Error guardando los cambios: " + err.message, "error");
    }
  };

  const enviarWhatsAppConfirmacion = async (pedido) => {
    try {
      // Obtener lista de productos del carrito
      let productos = [];
      if (typeof pedido.carrito === 'string') {
        try {
          productos = JSON.parse(pedido.carrito);
        } catch (e) {
          productos = [];
        }
      } else if (Array.isArray(pedido.carrito)) {
        productos = pedido.carrito;
      }

      // Crear lista de productos para el mensaje
      const listaProductos = productos.map(p => 
        `• ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString('es-AR')}`
      ).join('\n');

      const message =
        `✅ *TU PEDIDO HA SIDO CONFIRMADO*\n\n` +
        `📦 *Pedido #${pedido.id}*\n` +
        `👤 *Cliente:* ${pedido.nombre_cliente}\n\n` +
        `🛒 *Tus productos:*\n${listaProductos}\n\n` +
        `💰 *Total:* $${Number(pedido.total).toLocaleString('es-AR')}\n\n` +
        `🎉 *¡Gracias por tu compra!*\n` +
        `📦 Te actualizaremos por este medio el estado de tu pedido\n` +
        `🚀 Tu pedido está siendo preparado para envío`;

      const telefonoFormateado = pedido.telefono
        .replace(/\D/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Error enviando WhatsApp de confirmación:", error);
    }
  };

  const enviarWhatsAppModificacion = async (
    pedidoModificado,
    pedidoOriginal,
  ) => {
    try {
      let mensajeCambios = "";

      if (pedidoOriginal.total !== pedidoModificado.total) {
        const diferencia = pedidoModificado.total - pedidoOriginal.total;
        mensajeCambios += `💰 *Total modificado:* $${Number(pedidoOriginal.total)?.toLocaleString("es-AR")} → $${pedidoModificado.total?.toLocaleString("es-AR")} (${diferencia > 0 ? "+" : ""}$${diferencia.toLocaleString("es-AR")})\n`;
      }

      const productosOriginales =
        typeof pedidoOriginal.carrito === "string"
          ? JSON.parse(pedidoOriginal.carrito)
          : pedidoOriginal.carrito || [];

      mensajeCambios += "\n📦 *Cambios en productos:*\n";
      pedidoModificado.carrito.forEach((productoNuevo) => {
        const productoOriginal = productosOriginales.find(
          (p) => p.Id === productoNuevo.Id,
        );
        if (
          productoOriginal &&
          productoOriginal.cantidad !== productoNuevo.cantidad
        ) {
          mensajeCambios += `• ${productoNuevo.nombre}: ${productoOriginal.cantidad} → ${productoNuevo.cantidad} unidades\n`;
        }
      });

      const message =
        `🔄 *TU PEDIDO FUE MODIFICADO* #${pedidoModificado.id}\n\n` +
        `👤 *Cliente:* ${pedidoModificado.nombre_cliente}\n\n` +
        `⚠️ *Ajustes realizados:*\n\n${mensajeCambios}\n` +
        `📋 *Nuevo total:* $${pedidoModificado.total?.toLocaleString("es-AR")}\n\n` +
        `❓ *¿Aceptás los cambios?*\n` +
        `• Respondé "ACEPTO" para confirmar\n` +
        `• Respondé "RECHAZO" para cancelar\n\n` +
        `⏰ Tenés 10 minutos para responder`;

      const telefonoFormateado = pedidoModificado.telefono
        .replace(/\D/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Error enviando WhatsApp:", error);
    }
  };

  const cerrarSesionAdmin = async () => {
    await supabaseClient.auth.signOut();
    navigate("/");
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: "bg-yellow-100 text-yellow-800",
      aprobado: "bg-green-100 text-green-800",
      configurado: "bg-blue-100 text-blue-800",
      modificado: "bg-orange-100 text-orange-800",
      rechazado: "bg-red-100 text-red-800",
      pagado: "bg-purple-100 text-purple-800",
      vencido: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-50 text-red-400",
    };
    return (
      <span
        className={`${badges[estado] || badges.pendiente} px-3 py-1 rounded-full font-bold text-xs uppercase`}
      >
        {estado || "Pendiente"}
      </span>
    );
  };

  // Filtrar pedidos por estado
  const pedidosFiltrados =
    filtroEstado === "todos"
      ? pedidos
      : pedidos.filter((p) => p.estado === filtroEstado);

  const estadosConteo = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-spinner fa-spin text-5xl text-[#FF6600] mb-4"></i>
        <p className="font-bold text-xl text-gray-500">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <p className="font-bold text-xl text-red-600">
          Error de permisos o base de datos
        </p>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            window.location.reload();
          }}
          className="mt-6 bg-[#FF6600] text-white px-6 py-3 rounded-xl font-black hover:bg-orange-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="text-gray-800 min-h-screen bg-gray-50">
      {/* Toast global */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <header className="bg-zinc-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-2xl font-black italic">
              YA
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                ADMIN <span className="text-red-500">PANEL</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cargarPedidosAdmin}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
              title="Refrescar pedidos"
            >
              <i className="fas fa-sync-alt"></i>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={cerrarSesionAdmin}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2 shadow-md"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Pendientes",
              estado: "pendiente",
              color: "text-yellow-600",
              bg: "bg-yellow-50",
              icon: "fa-clock",
            },
            {
              label: "Configurados",
              estado: "configurado",
              color: "text-blue-600",
              bg: "bg-blue-50",
              icon: "fa-cog",
            },
            {
              label: "Pagados",
              estado: "pagado",
              color: "text-purple-600",
              bg: "bg-purple-50",
              icon: "fa-check-circle",
            },
            {
              label: "Total",
              estado: "todos",
              color: "text-gray-700",
              bg: "bg-white",
              icon: "fa-inbox",
            },
          ].map(({ label, estado, color, bg, icon }) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`${bg} ${filtroEstado === estado ? "ring-2 ring-[#FF6600]" : ""} rounded-2xl p-4 shadow-sm border border-gray-100 text-left transition hover:shadow-md`}
            >
              <div className={`text-2xl font-black ${color}`}>
                {estado === "todos"
                  ? pedidos.length
                  : estadosConteo[estado] || 0}
              </div>
              <div className="text-sm font-bold text-gray-500 flex items-center gap-1 mt-1">
                <i className={`fas ${icon} text-xs`}></i> {label}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
            <i className="fas fa-inbox text-[#FF6600]"></i>
            Pedidos
            {filtroEstado !== "todos" && (
              <span className="text-base font-bold text-gray-400 ml-2">
                — {filtroEstado}
              </span>
            )}
          </h2>
          <span className="text-sm text-gray-400 font-medium">
            {pedidosFiltrados.length} resultado
            {pedidosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fas fa-inbox text-5xl mb-4"></i>
              <p className="font-bold text-lg">
                No hay pedidos{" "}
                {filtroEstado !== "todos" ? `con estado "${filtroEstado}"` : ""}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-black">ID</th>
                    <th className="p-4 font-black">Cliente / Teléfono</th>
                    <th className="p-4 font-black">Monto / Método</th>
                    <th className="p-4 font-black">Estado</th>
                    <th className="p-4 font-black text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {pedidosFiltrados.map((p) => {
                    const tiempoRestante =
                      p.fuente === "web" &&
                      p.estado === "configurado" &&
                      p.expira_en
                        ? calcularTiempoRestante(p.expira_en)
                        : 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition border-b border-gray-100"
                      >
                        <td className="p-4 font-black text-gray-500">
                          #{p.id}
                          {p.fuente === "web" && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-xs ml-2">
                              Web
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">
                            {p.nombre_cliente}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <i className="fas fa-phone mr-1"></i>
                            {p.telefono}
                          </div>
                          {p.email && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              <i className="fas fa-envelope mr-1"></i>
                              {p.email}
                            </div>
                          )}
                          {p.metodo === "envio" ? (
                            <p className="text-xs font-bold text-blue-700 mt-1">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {p.direccion || "No especificó"}
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-gray-500 mt-1">
                              <i className="fas fa-store mr-1"></i>Retira en
                              Sucursal
                            </p>
                          )}
                          {p.fuente === "web" &&
                            p.estado === "configurado" &&
                            p.expira_en && (
                              <div className="text-xs font-bold mt-1">
                                {tiempoRestante > 0 ? (
                                  <span className="text-red-600">
                                    <i className="fas fa-clock mr-1"></i>
                                    {Math.floor(tiempoRestante / 60)}:
                                    {(tiempoRestante % 60)
                                      .toString()
                                      .padStart(2, "0")}{" "}
                                    para pagar
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    <i className="fas fa-clock mr-1"></i>Tiempo
                                    vencido
                                  </span>
                                )}
                              </div>
                            )}
                        </td>
                        <td className="p-4">
                          <div className="font-black text-[#FF6600] text-base">
                            ${Number(p.total).toLocaleString("es-AR")}
                          </div>
                          <div className="text-xs font-bold text-gray-500 uppercase mt-0.5">
                            {p.metodo || "envio"}
                          </div>
                        </td>
                        <td className="p-4">{getEstadoBadge(p.estado)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {p.fuente === "web" && p.estado === "pendiente" && (
                              <button
                                onClick={() => configurarPedido(p.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow text-xs font-black transition flex items-center gap-1"
                              >
                                <i className="fas fa-cog"></i> Configurar
                              </button>
                            )}
                            {p.fuente === "web" &&
                              p.estado === "configurado" && (
                                <button
                                  onClick={() => marcarPagado(p.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg shadow text-xs font-black transition flex items-center gap-1"
                                >
                                  <i className="fas fa-check"></i> Pagado
                                </button>
                              )}
                            {p.fuente !== "web" && (
                              <>
                                <button
                                  onClick={() =>
                                    cambiarEstado(p.id, "aprobado")
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white w-9 h-9 rounded-lg shadow flex items-center justify-center transition"
                                  title="Aprobar"
                                >
                                  <i className="fas fa-check text-xs"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    cambiarEstado(p.id, "rechazado")
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-lg shadow flex items-center justify-center transition"
                                  title="Rechazar"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => abrirModalModificar(p.id)}
                              className="bg-zinc-800 hover:bg-black text-white px-3 py-2 rounded-lg shadow text-xs font-bold transition flex items-center gap-1"
                            >
                              <i className="fas fa-eye"></i> Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de edición */}
      {modalOpen && pedidoEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <i className="fas fa-box-open text-[#FF6600]"></i> Pedido #
                  {pedidoEditando.id}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pedidoEditando.nombre_cliente} · {pedidoEditando.telefono}
                </p>
              </div>
              <button
                onClick={cerrarModalPedido}
                className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Info del cliente */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase">
                  Cliente
                </span>
                <p className="font-bold text-gray-800">
                  {pedidoEditando.nombre_cliente}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase">
                  Teléfono
                </span>
                <p className="font-bold text-gray-800">
                  {pedidoEditando.telefono}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase">
                  Dirección
                </span>
                <p className="font-bold text-gray-800">
                  {pedidoEditando.direccion || "No especificada"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase">
                  Estado
                </span>
                <p className="mt-0.5">
                  {getEstadoBadge(pedidoEditando.estado)}
                </p>
              </div>
              {pedidoEditando.email && (
                <div className="col-span-2">
                  <span className="text-gray-400 font-bold uppercase">
                    Email
                  </span>
                  <p className="font-bold text-gray-800">
                    {pedidoEditando.email}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <h4 className="font-black text-gray-700 text-sm mb-3 uppercase tracking-wide">
                Productos del pedido
              </h4>
              <div className="space-y-3">
                {pedidoEditando.carrito.map((item, index) => {
                  const estaEliminado = item.cantidad === 0;
                  return (
                    <div
                      key={index}
                      className={`${estaEliminado ? "bg-red-50 opacity-60" : "bg-white"} p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm`}
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">
                          {estaEliminado ? <s>{item.nombre}</s> : item.nombre}
                          {estaEliminado && (
                            <span className="text-red-500 ml-1 text-xs">
                              (Eliminado)
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          ${Number(item.precio).toLocaleString("es-AR")} c/u
                          {item.cantidad > 0 && (
                            <span className="ml-2 text-gray-700 font-bold">
                              = $
                              {(
                                Number(item.precio) * item.cantidad
                              ).toLocaleString("es-AR")}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => cambiarCantidadModal(index, -1)}
                            className="px-3 py-2 hover:bg-gray-200 font-black text-gray-600 transition disabled:opacity-30"
                            disabled={estaEliminado}
                          >
                            -
                          </button>
                          <span className="px-3 font-bold text-sm min-w-[40px] text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => cambiarCantidadModal(index, 1)}
                            className="px-3 py-2 hover:bg-gray-200 font-black text-gray-600 transition"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => eliminarDelModal(index)}
                          className="text-red-400 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition"
                          title="Quitar producto"
                          disabled={estaEliminado}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">
                  Total Modificado:
                </span>
                <span className="text-2xl font-black text-[#FF6600]">
                  ${pedidoEditando.total.toLocaleString("es-AR")}
                </span>
              </div>
              <button
                onClick={guardarModificacionPedido}
                className="w-full bg-[#FF6600] hover:bg-orange-600 text-white font-black py-3 px-4 rounded-xl transition shadow-md flex justify-center items-center gap-2"
              >
                <i className="fas fa-save"></i> Guardar y Notificar al Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
