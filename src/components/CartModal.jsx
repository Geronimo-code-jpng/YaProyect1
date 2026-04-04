import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Trash, User, Phone, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../db/supabeClient';

export default function CartModal() {
  const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedidoTimeout, setPedidoTimeout] = useState(null);
  const [orderData, setOrderData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    notas: ''
  });

  useEffect(() => {
    // Auto-fill user data if logged in and make it read-only
    if (userProfile) {
      setOrderData(prev => ({
        ...prev,
        nombre: userProfile.nombre || prev.nombre,
        telefono: userProfile.telefono || prev.telefono,
        direccion: userProfile.direccion || prev.direccion
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (pedidoTimeout) {
        clearTimeout(pedidoTimeout);
      }
    };
  }, [pedidoTimeout]);

  const verificarPedidosVencidos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('pedidos')
        .update({ 
          estado: 'cancelado', 
          horario: 'Pedido vencido por timeout de 10 minutos' 
        })
        .eq('estado', 'pendiente')
        .eq('fuente', 'web')
        .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        console.log(`Cancelados ${data.length} pedidos vencidos`);
      }
    } catch (error) {
      console.error('Error verificando pedidos vencidos:', error);
    }
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const changeQty = (index, delta) => {
    const item = cart[index];
    const newCantidad = Math.max(1, item.cantidad + delta);
    updateQuantity(item.id, newCantidad);
  };

  const setQty = (index, valorIngresado) => {
    let nuevaCantidad = parseInt(valorIngresado);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    const item = cart[index];
    updateQuantity(item.id, nuevaCantidad);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendOrderToAdmin = async () => {
    setIsSubmitting(true);
    
    try {
      // Verificar que el total sea mayor a 0
      if (cartTotal <= 0) {
        alert('❌ El total del pedido debe ser mayor a $0. Por favor agrega productos al carrito.');
        setIsSubmitting(false);
        return;
      }

      // Verificar que haya productos en el carrito
      if (cart.length === 0) {
        alert('❌ No hay productos en el carrito. Por favor agrega productos antes de continuar.');
        setIsSubmitting(false);
        return;
      }

      // Verificar pedidos vencidos antes de crear uno nuevo
      await verificarPedidosVencidos();

      // Guardar pedido en Supabase con estado pendiente (usando tabla pedidos existente)
      const pedidoData = {
        nombre_cliente: orderData.nombre,
        telefono: orderData.telefono,
        direccion: orderData.direccion,
        carrito: cart.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.precio * item.cantidad
        })),
        total: cartTotal,
        estado: 'pendiente',
        metodo: 'envio',
        created_at: new Date().toISOString(),
        expira_en: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        fuente: 'web',
        horario: orderData.notas || 'Sin notas'
      };

      const { data, error } = await supabaseClient
        .from('pedidos')
        .insert(pedidoData)
        .select()
        .single();

      if (error) throw error;

      // Configurar timeout para cancelación automática
      const timeoutId = setTimeout(async () => {
        try {
          const { error: cancelError } = await supabaseClient
            .from('pedidos')
            .update({ 
              estado: 'cancelado',
              horario: 'Pedido cancelado automáticamente por timeout de 10 minutos'
            })
            .eq('id', data.id)
            .eq('estado', 'pendiente');

          if (cancelError) throw cancelError;
          console.log(`Pedido #${data.id} cancelado automáticamente por timeout`);
        } catch (error) {
          console.error('Error cancelando pedido automáticamente:', error);
        }
      }, 10 * 60 * 1000); // 10 minutos

      setPedidoTimeout(timeoutId);

      // Enviar mensaje por WhatsApp
      const message = `🛒 *NUEVO PEDIDO WEB* #${data.id}\n\n` +
        `👤 *Cliente:* ${orderData.nombre}\n` +
        `📞 *Teléfono:* ${orderData.telefono}\n` +
        `📍 *Dirección:* ${orderData.direccion}\n\n` +
        `📦 *Productos:*\n` +
        cart.map(item => `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toLocaleString('es-AR')}`).join('\n') +
        `\n\n💰 *Total:* $${cartTotal.toLocaleString('es-AR')}\n\n` +
        `📝 *Notas:* ${orderData.notas || 'Ninguna'}\n\n` +
        `⏰ *Tiempo límite:* 10 minutos para aceptar\n` +
        `🔗 *Gestionar pedido:* ${window.location.origin}/admin.html`;

      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/5491112345678?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      // Clear cart and close modal
      clearCart();
      setShowCheckout(false);
      setIsCartOpen(false);
      
      alert(`✅ Pedido #${data.id} enviado con éxito. Tiene 10 minutos para ser aceptado antes de cancelarse automáticamente. Te contactaremos pronto para confirmar.`);
    } catch (error) {
      console.error('Error sending order:', error);
      alert('❌ Error al enviar el pedido. Por favor intenta nuevamente.');
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
          <button onClick={toggleCart} className="text-4xl text-gray-400 hover:text-red-500 leading-none">
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
              <div key={`${item.id}-${index}`} className="flex gap-4 mb-5 pb-5 border-b relative">
                <img 
                  src={item.imagen} 
                  className="w-20 h-20 object-contain rounded-xl border p-1 bg-white" 
                  alt={item.nombre}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm pr-6">{item.nombre}</h4>
                  <div className="font-black text-[#FF6600]">
                    ${item.precio.toLocaleString('es-AR')}
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
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      className="w-12 h-8 text-center font-black focus:outline-none focus:bg-blue-50 text-gray-700"
                      style={{MozAppearance: 'textfield'}}
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
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <Trash size={30}/>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between text-2xl font-black mb-4">
            <span>Subtotal:</span>
            <span className="text-[#FF6600]">${cartTotal.toLocaleString('es-AR')}</span>
          </div>
          <button 
            className="w-full py-4 bg-[#FF6600] hover:bg-orange-700 text-white text-lg font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            onClick={() => setShowCheckout(true)}
          >
            Completar Compra <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <i className="fas fa-clipboard-list text-[#FF6600]"></i> 
                Finalizar Pedido
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Nombre completo
                </label>
                {userProfile ? (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-700">
                    {orderData.nombre}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="nombre"
                    value={orderData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                    placeholder="Tu nombre"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Teléfono
                </label>
                {userProfile ? (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-700">
                    {orderData.telefono}
                  </div>
                ) : (
                  <input
                    type="tel"
                    name="telefono"
                    value={orderData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                    placeholder="Tu teléfono"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Dirección de entrega
                </label>
                {userProfile ? (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-700">
                    {orderData.direccion}
                  </div>
                ) : (
                  <textarea
                    name="direccion"
                    value={orderData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                    placeholder="Calle, número, departamento..."
                    rows="2"
                    required
                  />
                )}
              </div>
              
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
                  <span>Total del pedido:</span>
                  <span className="text-[#FF6600]">${cartTotal.toLocaleString('es-AR')}</span>
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
                disabled={isSubmitting || !orderData.nombre || !orderData.telefono || !orderData.direccion}
                className="flex-1 py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-whatsapp"></i>
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
