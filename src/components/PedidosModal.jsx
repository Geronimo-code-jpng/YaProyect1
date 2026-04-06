import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { supabaseClient } from "../db/supabeClient";

// Countdown Timer Component
function CountdownTimer({ expira_en, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expira_en) - new Date();
      if (difference > 0) {
        return {
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Si el tiempo se venció, llamar a onExpire
      if (newTimeLeft === null && timeLeft !== null) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expira_en, onExpire]);

  if (!timeLeft) {
    return <span className="text-red-600 font-bold">⏰ Tiempo vencido</span>;
  }

  return (
    <span className="text-blue-600 font-bold">
      ⏰ {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, "0")} para
      pagar
    </span>
  );
}

// Create a ref to store the openPedidos function
let openPedidosRef = null;

export default function PedidosModal() {
  const { user, userProfile } = useAuth();
  const { showError, showSuccess, showWarning } = useAlert();
  const [showModal, setShowModal] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const openPedidos = () => {
    setShowModal(true);
    cargarPedidos();
  };

  // Store the function in the ref
  openPedidosRef = openPedidos;

  const closePedidos = () => {
    setShowModal(false);
  };

  const handleTiempoExpirado = async (pedidoId) => {
    try {
      // Actualizar el estado del pedido a 'vencido' en la base de datos
      const { error } = await supabaseClient
        .from("pedidos")
        .update({ estado: "vencido" })
        .eq("id", pedidoId);

      if (error) {
        console.error("❌ Error actualizando pedido vencido:", error);
        return;
      }

      // Recargar los pedidos para actualizar la UI
      cargarPedidos();

      showSuccess(
        "⏰ El tiempo de pago ha expirado. El pedido ha sido cancelado.",
      );
    } catch (error) {
      console.error("❌ Error manejando expiración:", error);
    }
  };

  // Función para verificar si el tiempo ha expirado
  const verificarTiempoExpirado = (expira_en) => {
    return new Date(expira_en) <= new Date();
  };

  const verificarEstadoPago = async (pedidoId) => {
    try {
      const { data: pedido, error } = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();

      if (error) {
        console.error("❌ Error obteniendo pedido:", error);
        return;
      }

      if (pedido.estado === "pagado") {
        showSuccess("✅ ¡Pago confirmado! Tu pedido está siendo procesado.");
        await cargarPedidos();
      } else {
        showWarning("⏳ El pago está siendo procesado. Por favor, espera un momento...");
        // Reintentar después de 5 segundos
        setTimeout(() => verificarEstadoPago(pedidoId), 5000);
      }
    } catch (error) {
      console.error("❌ Error verificando estado del pago:", error);
      showError("Error verificando el estado del pago");
    }
  };

  // Verificar estado del pago al cargar el modal si viene de Mercado Pago
  useEffect(() => {
    if (showModal) {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("status");
      const pedidoId = urlParams.get("pedido");

      if (status === "success" && pedidoId) {
        verificarEstadoPago(parseInt(pedidoId));
        // Limpiar URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [showModal]);

  const generarLinkPagoCliente = async (pedido) => {
    try {
      showWarning("🔄 Generando link de pago...");

      // Usar las credenciales desde variables de entorno
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPBASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Configuración de Supabase no encontrada");
      }

      // Parsear carrito correctamente sin importar el formato
      let payloadCart = [];
      if (typeof pedido.carrito === "string") {
        try {
          payloadCart = JSON.parse(pedido.carrito);
        } catch (e) {
          throw new Error("El carrito del pedido tiene un formato inválido");
        }
      } else if (Array.isArray(pedido.carrito)) {
        payloadCart = pedido.carrito;
      } else {
        throw new Error("El carrito del pedido está vacío o es inválido");
      }

      // Filtrar items con cantidad > 0
      payloadCart = payloadCart.filter((item) => item.cantidad > 0);

      if (payloadCart.length === 0) {
        throw new Error("El carrito no tiene productos válidos");
      }

      // Calcular total real del carrito
      const totalCarrito = payloadCart.reduce(
        (a, b) => a + Number(b.precio) * Number(b.cantidad),
        0,
      );
      const totalPedido = Number(pedido.total);

      // Solo agregar ajuste si la diferencia es positiva y significativa (ej: costo de envío)
      const diferencia = Math.round(totalPedido - totalCarrito);
      if (diferencia > 0) {
        payloadCart.push({
          nombre: "Costo de Envío",
          imagen: "",
          precio: diferencia,
          cantidad: 1,
        });
      }
      // Si diferencia es negativa, no agregar nada — los precios del carrito ya son correctos

      // Para Edge Functions de Supabase, siempre usar el anon_key
      const authToken = supabaseAnonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/crear-pago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
          apikey: authToken,
        },
        body: JSON.stringify({ cart: payloadCart, idPedido: pedido.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Error al generar preferencia de pago";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Respuesta inválida del servidor: " + responseText.substring(0, 200),
        );
      }

      if (data?.link_pago) {
        showSuccess("✅ Redirigiendo a Mercado Pago...");
        window.location.href = data.link_pago;
      } else {
        throw new Error(
          "No se recibió link de pago. Respuesta: " + JSON.stringify(data),
        );
      }
    } catch (error) {
      console.error("❌ Error generando link de pago:", error);
      showError("❌ Error al generar link de pago: " + error.message);
    }
  };

  const confirmarModificacion = async (pedidoId) => {
    try {
      // Cambiar directamente a configurado con 10 minutos
      const fechaVencimiento = new Date(
        Date.now() + 10 * 60 * 1000,
      ).toISOString();

      const { error } = await supabaseClient
        .from("pedidos")
        .update({
          estado: "configurado",
          expira_en: fechaVencimiento,
          horario: "Modificación confirmada - iniciando pago",
        })
        .eq("id", pedidoId);

      if (error) throw error;

      showSuccess("✅ Modificación confirmada. Tenés 10 minutos para pagar.");
      cargarPedidos(); // Recargar la lista
    } catch (error) {
      console.error("Error confirmando modificación:", error);
      showError("Error al confirmar la modificación. Intenta nuevamente.");
    }
  };

  const cargarPedidos = async () => {
    if (!user && !userProfile) {
      console.log("🔍 No hay usuario ni perfil, no se pueden cargar pedidos");
      return;
    }

    setIsLoading(true);
    try {
      let query = supabaseClient
        .from("pedidos")
        .select("*")
        .match({ user_id: user.id });

      // ESTRATEGIA 1: Si el usuario está logueado, buscar PRIMERO por user_id
      if (user && user.id) {
        query = query.eq("user_id", user.id);
      }
      // ESTRATEGIA 2: Si no está logueado, buscar por email O teléfono exactos
      else if (userProfile) {

        // Buscar por email exacto en el perfil del usuario
        if (userProfile.email) {
          // También buscar en el campo email del perfil si existe
          query = query.or(
            `email.eq.${userProfile.email},nombre_cliente.ilike.%${userProfile.nombre || ""}%,telefono.eq.${userProfile.telefono || ""}`,
          );
        } else {
          // Si no hay email, buscar por teléfono y nombre
          query = query.or(
            `nombre_cliente.ilike.%${userProfile.nombre || ""}%,telefono.eq.${userProfile.telefono || ""}`,
          );
        }
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("❌ Error detallado cargando pedidos:", error);
        throw error;
      }

      // Asegurarse de que data sea un array
      const pedidosArray = Array.isArray(data) ? data : [];

      // FILTRADO ADICIONAL: Verificar que los pedidos realmente pertenezcan al usuario
      const pedidosFiltrados = pedidosArray.filter((pedido, index) => {
        // Si tiene user_id y coincide, es del usuario
        if (user && user.id && pedido.user_id === user.id) {
          return true;
        }

        // Si no tiene user_id, verificar por email o teléfono
        if (!pedido.user_id && userProfile) {
          const coincideEmail =
            userProfile.email &&
            (pedido.email === userProfile.email ||
              pedido.nombre_cliente
                ?.toLowerCase()
                .includes(userProfile.email.toLowerCase()));

          const coincideTelefono =
            userProfile.telefono &&
            (pedido.telefono === userProfile.telefono ||
              pedido.nombre_cliente
                ?.toLowerCase()
                .includes(userProfile.telefono.toLowerCase()));

          const coincideNombre =
            userProfile.nombre &&
            pedido.nombre_cliente
              ?.toLowerCase()
              .includes(userProfile.nombre.toLowerCase());

          const resultado = coincideEmail || coincideTelefono || coincideNombre;

          return resultado;
        }

        return false;
      });

      // Agregar número de pedido secuencial por usuario

      // Agregar número de pedido secuencial por usuario
      const pedidosConNumero = pedidosFiltrados.map((pedido, index) => ({
        ...pedido,
        numeroPedidoUsuario: pedidosFiltrados.length - index, // Mi pedido #1, #2, etc.
      }));

      setPedidos(pedidosConNumero);
    } catch (error) {
      console.error("❌ Error cargando pedidos web:", error);
      showError("Error cargando tus pedidos: " + error.message);
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      aprobado: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Aprobado",
      },
      pagado: { bg: "bg-blue-100", text: "text-blue-800", label: "Pagado" },
      rechazado: { bg: "bg-red-100", text: "text-red-800", label: "Rechazado" },
      modificado: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Modificado",
      },
      configurado: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "⏰ Tiempo para Pagar",
      },
      vencido: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "⏰ Vencido",
      },
      pendiente: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Pendiente",
      },
    };
    return badges[estado] || badges.pendiente;
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col modal-animate shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <i className="fas fa-box-open text-[#FF6600]"></i>
            Mis Pedidos
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={closePedidos}
              className="text-4xl text-gray-400 hover:text-black leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-10">
              <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
              <p className="text-lg font-bold text-gray-500">
                Cargando pedidos...
              </p>
            </div>
          ) : !Array.isArray(pedidos) || pedidos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <i className="fas fa-inbox text-6xl mb-4"></i>
              <p className="text-lg font-bold">No tienes pedidos aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map((pedido) => {
                const statusBadge = getStatusBadge(pedido.estado);
                return (
                  <div
                    key={pedido.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-lg">
                          Mi Pedido #{pedido.numeroPedidoUsuario}
                        </h4>
                        <p className="text-gray-600 text-xs">
                          ID: #{pedido.id}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {new Date(pedido.created_at).toLocaleDateString(
                            "es-AR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                        {/* Mostrar countdown si está configurado */}
                        {pedido.estado === "configurado" &&
                          pedido.expira_en && (
                            <div className="mt-2">
                              <CountdownTimer
                                expira_en={pedido.expira_en}
                                onExpire={() => cargarPedidos()}
                              />
                            </div>
                          )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Botón de pago para pedidos configurados */}
                    {pedido.estado === "configurado" &&
                      pedido.expira_en &&
                      !verificarTiempoExpirado(pedido.expira_en) && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <i className="fas fa-credit-card"></i>
                            ¡Tu pedido está listo para pagar!
                          </h5>
                          <div className="mb-3">
                            <CountdownTimer
                              expira_en={pedido.expira_en}
                              onExpire={() => handleTiempoExpirado(pedido.id)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => generarLinkPagoCliente(pedido)}
                              className="flex-1 bg-[#009EE3] hover:bg-[#007DB5] text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-credit-card"></i>
                              Pagar con Mercado Pago
                            </button>
                          </div>
                          <p className="text-xs text-blue-600 mt-2 text-center">
                            ⏰ Tienes 10 minutos para completar el pago
                          </p>
                        </div>
                      )}

                    {/* Mensaje de tiempo vencido */}
                    {pedido.estado === "configurado" &&
                      pedido.expira_en &&
                      verificarTiempoExpirado(pedido.expira_en) && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <h5 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                            <i className="fas fa-clock"></i>
                            ¡Tiempo de pago expirado!
                          </h5>
                          <p className="text-sm text-red-700">
                            El tiempo para completar el pago ha finalizado. Tu
                            pedido ha sido cancelado automáticamente.
                          </p>
                          <p className="text-xs text-red-600 mt-2 text-center">
                            ⏰ Si deseas realizar un nuevo pedido, por favor
                            contáctanos.
                          </p>
                        </div>
                      )}

                    {/* Botón de confirmación para pedidos modificados */}
                    {pedido.estado === "modificado" && (
                      <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                          <i className="fas fa-exclamation-triangle"></i>
                          ¡Tu pedido fue modificado por el administrador!
                        </h5>
                        <p className="text-sm text-orange-700 mb-3">
                          El administrador realizó cambios en tu pedido. Si
                          confirmas, tendrás 10 minutos para pagar.
                        </p>
                        <button
                          onClick={() => confirmarModificacion(pedido.id)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-check"></i>
                          Confirmar Modificación
                        </button>
                        <p className="text-xs text-orange-600 mt-2 text-center">
                          ⏰ Al confirmar, tendrás 10 minutos para completar el
                          pago
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">
                          Productos:
                        </h5>
                        <div className="space-y-2">
                          {(() => {
                            let carritoArray = [];

                            // Manejar diferentes formatos de carrito
                            if (typeof pedido.carrito === "string") {
                              try {
                                carritoArray = JSON.parse(pedido.carrito);
                              } catch (e) {
                                console.error("Error parsing carrito:", e);
                                carritoArray = [];
                              }
                            } else if (Array.isArray(pedido.carrito)) {
                              carritoArray = pedido.carrito;
                            }

                            return Array.isArray(carritoArray) &&
                              carritoArray.length > 0 ? (
                              carritoArray.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm border-b pb-1"
                                >
                                  <div className="flex-1">
                                    <span className="font-medium">
                                      {item.nombre}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      x{item.cantidad}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black">
                                      ${(item.precio_unitario || item.precio || 0).toLocaleString("es-AR")} c/u
                                    </span>
                                    <div className="text-[#FF6600] font-bold">
                                      $
                                      {(
                                        (item.precio_unitario || item.precio || 0) * item.cantidad
                                      ).toLocaleString("es-AR")}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-sm italic">
                                No hay productos disponibles en este pedido
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">
                          Resumen del Pedido:
                        </h5>
                        <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>
                              ${pedido.total?.toLocaleString("es-AR") || "0"}
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Envío:</span>
                            <span>A convenir</span>
                          </div>
                          <div className="flex justify-between font-black text-lg border-t pt-2">
                            <span>Total:</span>
                            <span className="text-[#FF6600]">
                              ${pedido.total?.toLocaleString("es-AR") || "0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {pedido.historial && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                          <i className="fas fa-history"></i>
                          Historial de Modificación
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h6 className="font-bold text-gray-700 mb-2">
                              Antes de la modificación:
                            </h6>
                            <div className="space-y-1">
                              <p>
                                <span className="font-medium">Estado:</span>{" "}
                                {pedido.historial.estado_anterior}
                              </p>
                              <p>
                                <span className="font-medium">Total:</span> $
                                {pedido.historial.total_anterior?.toLocaleString(
                                  "es-AR",
                                ) || "0"}
                              </p>
                              <div>
                                <span className="font-medium">Productos:</span>
                                <div className="mt-1 ml-4">
                                  {(() => {
                                    let carritoAnterior = [];
                                    if (
                                      typeof pedido.historial
                                        .carrito_anterior === "string"
                                    ) {
                                      try {
                                        carritoAnterior = JSON.parse(
                                          pedido.historial.carrito_anterior,
                                        );
                                      } catch (e) {
                                        carritoAnterior = [];
                                      }
                                    } else if (
                                      Array.isArray(
                                        pedido.historial.carrito_anterior,
                                      )
                                    ) {
                                      carritoAnterior =
                                        pedido.historial.carrito_anterior;
                                    }

                                    return Array.isArray(carritoAnterior) &&
                                      carritoAnterior.length > 0 ? (
                                      carritoAnterior.map((item, index) => (
                                        <div
                                          key={index}
                                          className="text-xs text-gray-600"
                                        >
                                          • {item.nombre} x{item.cantidad} = $
                                          {(
                                            (item.precio_unitario || 0) * item.cantidad
                                          ).toLocaleString("es-AR")}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">
                                        Sin productos
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h6 className="font-bold text-gray-700 mb-2">
                              Después de la modificación:
                            </h6>
                            <div className="space-y-1">
                              <p>
                                <span className="font-medium">Estado:</span>{" "}
                                {pedido.historial.nuevo_estado}
                              </p>
                              <p>
                                <span className="font-medium">Total:</span> $
                                {pedido.historial.nuevo_total?.toLocaleString(
                                  "es-AR",
                                ) || "0"}
                              </p>
                              <div>
                                <span className="font-medium">Productos:</span>
                                <div className="mt-1 ml-4">
                                  {(() => {
                                    let carritoNuevo = [];
                                    if (
                                      typeof pedido.historial.nuevo_carrito ===
                                      "string"
                                    ) {
                                      try {
                                        carritoNuevo = JSON.parse(
                                          pedido.historial.nuevo_carrito,
                                        );
                                      } catch (e) {
                                        carritoNuevo = [];
                                      }
                                    } else if (
                                      Array.isArray(
                                        pedido.historial.nuevo_carrito,
                                      )
                                    ) {
                                      carritoNuevo =
                                        pedido.historial.nuevo_carrito;
                                    }

                                    return Array.isArray(carritoNuevo) &&
                                      carritoNuevo.length > 0 ? (
                                      carritoNuevo.map((item, index) => (
                                        <div
                                          key={index}
                                          className="text-xs text-gray-600"
                                        >
                                          • {item.nombre} x{item.cantidad} = $
                                          {(
                                            (item.precio_unitario || 0) * item.cantidad
                                          ).toLocaleString("es-AR")}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">
                                        Sin productos
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-700">
                          <p>
                            <span className="font-medium">Modificado por:</span>{" "}
                            {pedido.historial.modificado_por}
                          </p>
                          <p>
                            <span className="font-medium">Fecha:</span>{" "}
                            {new Date(
                              pedido.historial.fecha_modificacion,
                            ).toLocaleString("es-AR")}
                          </p>
                        </div>

                        {/* Botones de respuesta si el usuario no ha respondido aún */}
                        {pedido.estado === "modificado" &&
                          (!pedido.historial.respuesta_usuario ||
                            pedido.historial.respuesta_usuario === null) && (
                            <div className="mt-4 p-3 bg-white rounded-lg border border-orange-300">
                              <p className="text-sm font-bold text-orange-800 mb-2">
                                ¿Qué deseas hacer con este pedido modificado?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    responderModificacion(pedido.id, "aceptado")
                                  }
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1"
                                >
                                  <i className="fas fa-check"></i>
                                  Aceptar Cambios
                                </button>
                                <button
                                  onClick={() =>
                                    responderModificacion(
                                      pedido.id,
                                      "rechazado",
                                    )
                                  }
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1"
                                >
                                  <i className="fas fa-times"></i>
                                  Rechazar Pedido
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                ⏰ Tienes 10 minutos para responder antes de que
                                el pedido se cancele automáticamente
                              </p>
                            </div>
                          )}

                        {/* Mostrar respuesta si ya respondió */}
                        {pedido.historial.respuesta_usuario && (
                          <div
                            className={`mt-4 p-3 rounded-lg border ${
                              pedido.historial.respuesta_usuario === "aceptado"
                                ? "bg-green-50 border-green-300"
                                : "bg-red-50 border-red-300"
                            }`}
                          >
                            <p
                              className={`text-sm font-bold ${
                                pedido.historial.respuesta_usuario ===
                                "aceptado"
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              {pedido.historial.respuesta_usuario === "aceptado"
                                ? "✅ Aceptaste los cambios"
                                : "❌ Rechazaste el pedido"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {pedido.notas && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="font-bold text-yellow-800 mb-1">
                          Notas:
                        </h5>
                        <p className="text-sm text-yellow-700">
                          {pedido.notas}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export function to be used in NavBar
export const openPedidos = () => {
  if (openPedidosRef) {
    openPedidosRef();
  }
};
