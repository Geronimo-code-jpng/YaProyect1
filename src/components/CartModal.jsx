import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { Trash, User, Phone, MessageSquare, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase as supabaseClient } from "../lib/supabase";
import { openPedidos } from "../utils/pedidosUtils";

export default function CartModal() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    clearCart,
    getCartTotalWithDiscount,
    qualifiesForFirstBuyDiscount,
  } = useCart();
  const { user, userProfile, openAuthModal, switchTab } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedidoTimeout, setPedidoTimeout] = useState(null);
  const [orderData, setOrderData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
    metodoEntrega: "envio", // "envio" o "retiro"
  });
  const [dbUserData, setDbUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [shippingPrice, setShippingPrice] = useState(7200);

  // Cargar precio de envío desde la base de datos
  useEffect(() => {
    const loadShippingPrice = async () => {
      try {
        const { data: config, error } = await supabaseClient
          .from('configuracion')
          .select('precio_envio')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Error cargando precio de envío:', error);
          // Fallback a localStorage si hay error
          const savedPrice = localStorage.getItem('shippingPrice');
          if (savedPrice) {
            const price = parseInt(savedPrice, 10);
            setShippingPrice(price);
          }
          return;
        }
        
        if (config && config.precio_envio) {
          const price = config.precio_envio;
          setShippingPrice(price);
          // También guardar en localStorage como backup
          localStorage.setItem('shippingPrice', price.toString());
        }
      } catch (error) {
        console.error('Error cargando precio de envío:', error);
        // Fallback a localStorage
        const savedPrice = localStorage.getItem('shippingPrice');
        if (savedPrice) {
          const price = parseInt(savedPrice, 10);
          setShippingPrice(price);
        }
      }
    };
    
    loadShippingPrice();
  }, []);

  // Cargar datos del usuario desde la base de datos
  useEffect(() => {
    if (!user?.email) return;
    
    const loadUserData = async () => {
      try {
        setLoadingUserData(true);
        const { data, error } = await supabaseClient
          .from('perfiles')
          .select('nombre, telefono, direccion, tipo_cliente')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error('Error cargando datos del usuario:', error);
          return;
        }
        
        setDbUserData(data);
        setOrderData((prev) => ({
          ...prev,
          nombre: data.nombre || prev.nombre,
          telefono: data.telefono || prev.telefono,
          direccion: data.direccion || prev.direccion,
        }));
      } catch (err) {
        console.error('Error en loadUserData:', err);
      } finally {
        setLoadingUserData(false);
      }
    };
    
    loadUserData();
  }, [user?.email]);

  // Limpiar datos cuando el usuario cierra sesión
  useEffect(() => {
    if (!user) {
      setOrderData({
        nombre: "",
        telefono: "",
        direccion: "",
        notas: "",
        metodoEntrega: "envio",
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (pedidoTimeout) clearTimeout(pedidoTimeout);
    };
  }, [pedidoTimeout]);

  // Determinar si los campos están bloqueados (usuario logueado con datos de BD)
  const campoNombreBloqueado = !!(user && dbUserData?.nombre);
  const campoTelefonoBloqueado = !!(user && dbUserData?.telefono);
  const campoDireccionBloqueado = !!(user && dbUserData?.direccion);

  const verificarPedidosVencidos = async () => {
    try {
      const { error } = await supabaseClient
        .from("pedidos")
        .update({
          estado: "cancelado",
          horario: "Pedido vencido por timeout de 10 minutos",
        })
        .eq("estado", "pendiente")
        .eq("fuente", "web")
        .lt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .select();

      if (error) throw error;
      // Pedidos vencidos cancelados exitosamente
    } catch (error) {
      console.error("Error verificando pedidos vencidos:", error);
    }
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const changeQty = (index, delta) => {
    const item = cart[index];
    const newCantidad = Math.max(1, item.cantidad + delta);
    updateQuantity(item.Id, newCantidad);
  };

  const setQty = (index, valorIngresado) => {
    let nuevaCantidad = parseInt(valorIngresado);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    const item = cart[index];
    updateQuantity(item.Id, nuevaCantidad);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendOrderToAdmin = async () => {
    setIsSubmitting(true);

    try {
      // Verificar si el usuario está logueado
      if (!user) {
        showError(
          "❌ No puedes enviar el pedido. Crea una cuenta o inicia sesión para continuar.",
        );
        setIsSubmitting(false);
        openAuthModal(); // Abrir modal de autenticación
        return;
      }

      if (cartTotal <= 0) {
        showError(
          "❌ El total del pedido debe ser mayor a $0. Por favor agrega productos al carrito.",
        );
        setIsSubmitting(false);
        return;
      }

      if (cart.length === 0) {
        showError(
          "❌ No hay productos en el carrito. Por favor agrega productos antes de continuar.",
        );
        setIsSubmitting(false);
        return;
      }

      // Validar que los campos obligatorios estén completos
      if (
        !orderData.nombre.trim() ||
        !orderData.telefono.trim() ||
        (orderData.metodoEntrega === "envio" && !orderData.direccion.trim())
      ) {
        showError("❌ Por favor completá todos los campos obligatorios.");
        setIsSubmitting(false);
        return;
      }

      await verificarPedidosVencidos();

      const pedidoData = {
        nombre_cliente: orderData.nombre.trim(),
        telefono: orderData.telefono.trim(),
        direccion:
          orderData.metodoEntrega === "retiro"
            ? "Retiro en local"
            : orderData.direccion.trim(),
        carrito: cart.map((item) => ({
          Id: item.Id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio, // Se guarda como 'precio' en el JSON
          precio_unitario: item.precio, // Para compatibilidad con código existente
          subtotal: item.precio * item.cantidad,
        })),
        total:
          orderData.metodoEntrega === "retiro"
            ? (getCartTotalWithDiscount(userProfile) * 1.08)
            : (getCartTotalWithDiscount(userProfile) + shippingPrice) * 1.08,
        descuento_aplicado: qualifiesForFirstBuyDiscount(userProfile)
          ? 1000
          : 0,
        estado: "pendiente",
        metodo: orderData.metodoEntrega,
        created_at: new Date().toISOString(),
        expira_en: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        fuente: "web",
        horario: orderData.notas.trim() || "Sin notas",
        user_id: user?.id || null,
      };

      const { data, error } = await supabaseClient
        .from("pedidos")
        .insert(pedidoData)
        .select()
        .single();

      if (error) throw error;

      // Actualizar cantidad de pedidos del usuario
      if (user) {
        try {
          await supabaseClient
            .from("perfiles")
            .update({
              cantidad_pedidos: (userProfile?.cantidad_pedidos || 0) + 1,
            })
            .eq("id", user.id);
        } catch (updateError) {
          console.error("Error actualizando cantidad de pedidos:", updateError);
          // No fallar el pedido si no se puede actualizar el contador
        }
      }

      // Timeout para cancelación automática (usando id en minúscula)
      const timeoutId = setTimeout(
        async () => {
          try {
            await supabaseClient
              .from("pedidos")
              .update({
                estado: "cancelado",
                horario:
                  "Pedido cancelado automáticamente por timeout de 10 minutos",
              })
              .eq("id", data.id)
              .eq("estado", "pendiente");
          } catch (error) {
            console.error("Error cancelando pedido automáticamente:", error);
          }
        },
        10 * 60 * 1000,
      );

      setPedidoTimeout(timeoutId);

      clearCart();
      setShowCheckout(false);
      setIsCartOpen(false);

      showSuccess("¡Pedido enviado! Lo revisaremos a la brevedad.");

      setTimeout(() => {
        if (!user) {
          if (
            confirm(
              "Para ver el estado de tu pedido, necesitas una cuenta. ¿Querés crear una cuenta gratuita ahora?",
            )
          ) {
            switchTab("register");
            openAuthModal();
          }
        } else {
          if (confirm("¿Querés ver el estado de tu pedido en 'Mis Pedidos'?")) {
            openPedidos();
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending order:", error);
      showError("❌ Error al enviar el pedido. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-9000 flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <i className="fas fa-shopping-cart text-[#FF6600]"></i> Mi Pedido
          </h3>
          <button
            onClick={toggleCart}
            className="text-4xl text-gray-400 hover:text-red-500 leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <i className="fas fa-shopping-basket text-6xl mb-4 text-gray-300"></i>
              <p className="text-lg font-bold">Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={`${item.Id}-${index}`}
                className="flex gap-4 mb-5 pb-5 border-b relative"
              >
                <img
                  src={
                    item.imagen ||
                    "https://via.placeholder.com/80/f3f4f6/a1a1aa?text=Prod"
                  }
                  className="w-20 h-20 object-contain rounded-xl border p-1 bg-white"
                  alt={item.nombre}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm pr-6">{item.nombre}</h4>
                  <div className="font-black text-[#FF6600]">
                    ${item.precio.toLocaleString("es-AR")}
                  </div>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden mt-2 w-max relative">
                    <button
                      onClick={() => changeQty(index, -1)}
                      className="w-8 h-8 font-bold bg-gray-50 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => setQty(index, e.target.value)}
                      onInput={(e) =>
                        (e.target.value = e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="w-12 h-8 text-center font-black focus:outline-none focus:bg-blue-50 text-gray-700"
                      style={{ MozAppearance: "textfield" }}
                    />
                    <button
                      onClick={() => changeQty(index, 1)}
                      className="w-8 h-8 font-bold bg-gray-50 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.Id)}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <Trash size={30} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between text-2xl font-black mb-4">
            <span>Subtotal:</span>
            <span className="text-[#FF6600]">
              ${cartTotal.toLocaleString("es-AR")}
            </span>
          </div>
          <button
            className="w-full py-4 bg-[#FF6600] hover:bg-orange-700 text-white text-lg font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
          >
            Completar Compra <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <i className="fas fa-clipboard-list text-[#FF6600]"></i>
                Finalizar Pedido
              </h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-3xl text-gray-400 hover:text-red-500 leading-none"
              >
                &times;
              </button>
            </div>

            {/* Banner de datos verificados si está logueado */}
            {user && (
              <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-bold">
                <Lock size={14} />
                Los datos de tu cuenta se usarán para el pedido
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Nombre completo
                  {campoNombreBloqueado && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (de tu cuenta)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="nombre"
                    value={loadingUserData ? 'Cargando...' : orderData.nombre}
                    onChange={
                      campoNombreBloqueado ? undefined : handleInputChange
                    }
                    readOnly={campoNombreBloqueado || loadingUserData}
                    className={`w-full px-4 py-3 border rounded-xl font-medium focus:outline-none transition ${
                      campoNombreBloqueado || loadingUserData
                        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                        : "border-gray-200 focus:border-[#FF6600]"
                    }`}
                    placeholder={loadingUserData ? 'Cargando datos...' : 'Tu nombre completo'}
                  />
                  {campoNombreBloqueado && (
                    <Lock
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  )}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Teléfono
                  {campoTelefonoBloqueado && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (de tu cuenta)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="telefono"
                    value={loadingUserData ? 'Cargando...' : orderData.telefono}
                    onChange={
                      campoTelefonoBloqueado ? undefined : handleInputChange
                    }
                    readOnly={campoTelefonoBloqueado || loadingUserData}
                    className={`w-full px-4 py-3 border rounded-xl font-medium focus:outline-none transition ${
                      campoTelefonoBloqueado || loadingUserData
                        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                        : "border-gray-200 focus:border-[#FF6600]"
                    }`}
                    placeholder={loadingUserData ? 'Cargando datos...' : 'Tu teléfono'}
                  />
                  {campoTelefonoBloqueado && (
                    <Lock
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  )}
                </div>
              </div>

              {/* Método de Entrega */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <i className="fas fa-truck mr-2"></i>
                  Método de entrega
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="metodoEntrega"
                      value="envio"
                      checked={orderData.metodoEntrega === "envio"}
                      onChange={handleInputChange}
                      className="mr-3 text-[#FF6600] focus:ring-[#FF6600]"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Envío a domicilio</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (+ ${shippingPrice.toLocaleString('es-AR')})
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="metodoEntrega"
                      value="retiro"
                      checked={orderData.metodoEntrega === "retiro"}
                      onChange={handleInputChange}
                      className="mr-3 text-[#FF6600] focus:ring-[#FF6600]"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Retiro en local</span>
                      <span className="text-sm text-green-600 ml-2">
                        (Gratis)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dirección - solo mostrar si es envío */}
              {orderData.metodoEntrega === "envio" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    Dirección de entrega
                    {campoDireccionBloqueado && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        (de tu cuenta)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="direccion"
                      value={loadingUserData ? 'Cargando...' : orderData.direccion}
                      onChange={
                        campoDireccionBloqueado ? undefined : handleInputChange
                      }
                      readOnly={campoDireccionBloqueado || loadingUserData}
                      className={`w-full px-4 py-3 border rounded-xl font-medium focus:outline-none transition ${
                        campoDireccionBloqueado || loadingUserData
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-200 focus:border-[#FF6600]"
                      }`}
                      placeholder={loadingUserData ? 'Cargando datos...' : 'Tu dirección'}
                    />
                    {campoDireccionBloqueado && (
                      <Lock
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <MessageSquare size={16} className="inline mr-2" />
                  Notas (opcional)
                </label>
                <textarea
                  name="notas"
                  value={orderData.notas}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                  placeholder="Alguna indicación especial..."
                  rows="2"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between text-lg font-black mb-2">
                  <span>Subtotal:</span>
                  <span>${cartTotal.toLocaleString("es-AR")}</span>
                </div>

                {/* Descuento de primera compra */}
                {qualifiesForFirstBuyDiscount(userProfile) && (
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-green-600">
                      🎉 Descuento primera compra:
                    </span>
                    <span className="text-green-600">-$1.000</span>
                  </div>
                )}

                {orderData.metodoEntrega === "envio" && (
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Costo de envío:</span>
                    <span className="text-gray-600">${shippingPrice.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Impuestos Nacionales (8%):</span>
                  <span className="text-gray-600">
                    ${(cartTotal * 0.08).toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="border-t pt-2 flex justify-between text-xl font-black">
                  <span>Total:</span>
                  <span className="text-[#FF6600]">
                    $
                    {(orderData.metodoEntrega === "retiro"
                      ? (getCartTotalWithDiscount(userProfile) + getCartTotalWithDiscount(userProfile)* 0.08)
                      : (getCartTotalWithDiscount(userProfile) + shippingPrice + getCartTotalWithDiscount(userProfile)* 0.08)    
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-2">
                  {cart.length} {cart.length === 1 ? "producto" : "productos"}
                  {qualifiesForFirstBuyDiscount(userProfile) && (
                    <span className="text-green-600 ml-2">
                      ✨ ¡$1.000 OFF aplicado!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-black rounded-xl transition"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={sendOrderToAdmin}
                disabled={
                  isSubmitting ||
                  !orderData.nombre.trim() ||
                  !orderData.telefono.trim() ||
                  (orderData.metodoEntrega === "envio" &&
                    !orderData.direccion.trim())
                }
                className="flex-1 py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Enviar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
