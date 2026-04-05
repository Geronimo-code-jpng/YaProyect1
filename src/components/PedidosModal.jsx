import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { supabaseClient } from '../db/supabeClient';

// Countdown Timer Component
function CountdownTimer({ expira_en, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!expira_en) return;

    const calculateTimeLeft = () => {
      const difference = new Date(expira_en) - new Date();
      if (difference > 0) {
        return {
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (!newTimeLeft) {
        setTimeLeft(null);
        if (onExpire) onExpire();
        clearInterval(timer);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expira_en, onExpire]);

  if (!timeLeft) {
    return (
      <span className="text-red-600 font-bold">
        ⏰ Tiempo vencido
      </span>
    );
  }

  return (
    <span className="text-red-600 font-bold animate-pulse">
      ⏰ {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')} para pagar
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

  const confirmarModificacion = async (pedidoId) => {
    try {
      // Cambiar directamente a configurado con 10 minutos
      const fechaVencimiento = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      const { error } = await supabaseClient
        .from('pedidos')
        .update({ 
          estado: 'configurado',
          expira_en: fechaVencimiento,
          horario: 'Modificación confirmada - iniciando pago'
        })
        .eq('id', pedidoId);

      if (error) throw error;
      
      showSuccess('✅ Modificación confirmada. Tenés 10 minutos para pagar.');
      cargarPedidos(); // Recargar la lista
    } catch (error) {
      console.error('Error confirmando modificación:', error);
      showError('Error al confirmar la modificación. Intenta nuevamente.');
    }
  };

  const cargarPedidos = async () => {
    if (!user && !userProfile) {
      console.log('🔍 No hay usuario ni perfil, no se pueden cargar pedidos');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔍 Cargando pedidos para usuario:', {
        userId: user?.id,
        userEmail: user?.email,
        profileEmail: userProfile?.email,
        profileTelefono: userProfile?.telefono,
        profileNombre: userProfile?.nombre
      });
      
      let query = supabaseClient
        .from('pedidos')
        .select('*');

      // ESTRATEGIA 1: Si el usuario está logueado, buscar PRIMERO por user_id
      if (user && user.id) {
        console.log('🔍 Buscando pedidos por user_id:', user.id);
        query = query.eq('user_id', user.id);
      }
      // ESTRATEGIA 2: Si no está logueado, buscar por email O teléfono exactos
      else if (userProfile) {
        console.log('🔍 Buscando pedidos por email/teléfono:', userProfile.email, userProfile.telefono);
        
        // Buscar por email exacto en el perfil del usuario
        if (userProfile.email) {
          // También buscar en el campo email del perfil si existe
          query = query.or(`email.eq.${userProfile.email},nombre_cliente.ilike.%${userProfile.nombre || ''}%,telefono.eq.${userProfile.telefono || ''}`);
        } else {
          // Si no hay email, buscar por teléfono y nombre
          query = query.or(`nombre_cliente.ilike.%${userProfile.nombre || ''}%,telefono.eq.${userProfile.telefono || ''}`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error detallado cargando pedidos:', error);
        throw error;
      }
      
      console.log('🔍 Pedidos crudos encontrados:', data?.length || 0, data);
      
      // Asegurarse de que data sea un array
      const pedidosArray = Array.isArray(data) ? data : [];
      
      // FILTRADO ADICIONAL: Verificar que los pedidos realmente pertenezcan al usuario
      const pedidosFiltrados = pedidosArray.filter((pedido, index) => {
        console.log(`🔍 Analizando pedido ${index + 1}:`, {
          pedidoId: pedido.id,
          pedidoUserId: pedido.user_id,
          pedidoEmail: pedido.email,
          pedidoTelefono: pedido.telefono,
          pedidoNombreCliente: pedido.nombre_cliente,
          pedidoEstado: pedido.estado
        });
        
        // Si tiene user_id y coincide, es del usuario
        if (user && user.id && pedido.user_id === user.id) {
          console.log('✅ Pedido coincide por user_id');
          return true;
        }
        
        // Si no tiene user_id, verificar por email o teléfono
        if (!pedido.user_id && userProfile) {
          const coincideEmail = userProfile.email && (
            pedido.email === userProfile.email || 
            pedido.nombre_cliente?.toLowerCase().includes(userProfile.email.toLowerCase())
          );
          
          const coincideTelefono = userProfile.telefono && (
            pedido.telefono === userProfile.telefono ||
            pedido.nombre_cliente?.toLowerCase().includes(userProfile.telefono.toLowerCase())
          );
          
          const coincideNombre = userProfile.nombre && 
            pedido.nombre_cliente?.toLowerCase().includes(userProfile.nombre.toLowerCase());
          
          const resultado = coincideEmail || coincideTelefono || coincideNombre;
          console.log('🔍 Verificación sin user_id:', {
            coincideEmail,
            coincideTelefono,
            coincideNombre,
            resultado
          });
          
          return resultado;
        }
        
        console.log('❌ Pedido no coincide con este usuario');
        return false;
      });
      
      console.log('✅ Pedidos filtrados para este usuario:', pedidosFiltrados.length, pedidosFiltrados);
      
      // Agregar número de pedido secuencial por usuario
      const pedidosConNumero = pedidosFiltrados.map((pedido, index) => ({
        ...pedido,
        numeroPedidoUsuario: pedidosFiltrados.length - index // Mi pedido #1, #2, etc.
      }));
      
      setPedidos(pedidosConNumero);
    } catch (error) {
      console.error('❌ Error cargando pedidos web:', error);
      showError("Error cargando tus pedidos: " + error.message);
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      'aprobado': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
      'pagado': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pagado' },
      'rechazado': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
      'modificado': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Modificado' },
      'configurado': { bg: 'bg-blue-100', text: 'text-blue-800', label: '⏰ Tiempo para Pagar' },
      'pendiente': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' }
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
              <p className="text-lg font-bold text-gray-500">Cargando pedidos...</p>
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
                  <div key={pedido.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-lg">Mi Pedido #{pedido.numeroPedidoUsuario}</h4>
                        <p className="text-gray-600 text-xs">ID: #{pedido.id}</p>
                        <p className="text-gray-600 text-sm">
                          {new Date(pedido.created_at).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        {/* Mostrar countdown si está configurado */}
                        {pedido.estado === 'configurado' && pedido.expira_en && (
                          <div className="mt-2">
                            <CountdownTimer 
                              expira_en={pedido.expira_en} 
                              onExpire={() => cargarPedidos()} 
                            />
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    
                    {/* Botón de confirmación para pedidos modificados */}
                    {pedido.estado === 'modificado' && (
                      <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                          <i className="fas fa-exclamation-triangle"></i>
                          ¡Tu pedido fue modificado por el administrador!
                        </h5>
                        <p className="text-sm text-orange-700 mb-3">
                          El administrador realizó cambios en tu pedido. Si confirmas, tendrás 10 minutos para pagar.
                        </p>
                        <button
                          onClick={() => confirmarModificacion(pedido.id)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-check"></i>
                          Confirmar Modificación
                        </button>
                        <p className="text-xs text-orange-600 mt-2 text-center">
                          ⏰ Al confirmar, tendrás 10 minutos para completar el pago
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">Productos:</h5>
                        <div className="space-y-2">
                          {(() => {
                            let carritoArray = [];
                            
                            // Manejar diferentes formatos de carrito
                            if (typeof pedido.carrito === 'string') {
                              try {
                                carritoArray = JSON.parse(pedido.carrito);
                              } catch (e) {
                                console.error('Error parsing carrito:', e);
                                carritoArray = [];
                              }
                            } else if (Array.isArray(pedido.carrito)) {
                              carritoArray = pedido.carrito;
                            }
                            
                            return Array.isArray(carritoArray) && carritoArray.length > 0 ? (
                              carritoArray.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm border-b pb-1">
                                  <div className="flex-1">
                                    <span className="font-medium">{item.nombre}</span>
                                    <span className="text-gray-500 ml-2">x{item.cantidad}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black">${item.precio.toLocaleString('es-AR')} c/u</span>
                                    <div className="text-[#FF6600] font-bold">
                                      ${(item.precio * item.cantidad).toLocaleString('es-AR')}
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
                        <h5 className="font-bold text-gray-700 mb-2">Resumen del Pedido:</h5>
                        <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${pedido.total?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Envío:</span>
                            <span>A convenir</span>
                          </div>
                          <div className="flex justify-between font-black text-lg border-t pt-2">
                            <span>Total:</span>
                            <span className="text-[#FF6600]">${pedido.total?.toLocaleString('es-AR') || '0'}</span>
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
                            <h6 className="font-bold text-gray-700 mb-2">Antes de la modificación:</h6>
                            <div className="space-y-1">
                              <p><span className="font-medium">Estado:</span> {pedido.historial.estado_anterior}</p>
                              <p><span className="font-medium">Total:</span> ${pedido.historial.total_anterior?.toLocaleString('es-AR') || '0'}</p>
                              <div>
                                <span className="font-medium">Productos:</span>
                                <div className="mt-1 ml-4">
                                  {(() => {
                                    let carritoAnterior = [];
                                    if (typeof pedido.historial.carrito_anterior === 'string') {
                                      try {
                                        carritoAnterior = JSON.parse(pedido.historial.carrito_anterior);
                                      } catch (e) {
                                        carritoAnterior = [];
                                      }
                                    } else if (Array.isArray(pedido.historial.carrito_anterior)) {
                                      carritoAnterior = pedido.historial.carrito_anterior;
                                    }
                                    
                                    return Array.isArray(carritoAnterior) && carritoAnterior.length > 0 ? (
                                      carritoAnterior.map((item, index) => (
                                        <div key={index} className="text-xs text-gray-600">
                                          • {item.nombre} x{item.cantidad} = ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">Sin productos</div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h6 className="font-bold text-gray-700 mb-2">Después de la modificación:</h6>
                            <div className="space-y-1">
                              <p><span className="font-medium">Estado:</span> {pedido.historial.nuevo_estado}</p>
                              <p><span className="font-medium">Total:</span> ${pedido.historial.nuevo_total?.toLocaleString('es-AR') || '0'}</p>
                              <div>
                                <span className="font-medium">Productos:</span>
                                <div className="mt-1 ml-4">
                                  {(() => {
                                    let carritoNuevo = [];
                                    if (typeof pedido.historial.nuevo_carrito === 'string') {
                                      try {
                                        carritoNuevo = JSON.parse(pedido.historial.nuevo_carrito);
                                      } catch (e) {
                                        carritoNuevo = [];
                                      }
                                    } else if (Array.isArray(pedido.historial.nuevo_carrito)) {
                                      carritoNuevo = pedido.historial.nuevo_carrito;
                                    }
                                    
                                    return Array.isArray(carritoNuevo) && carritoNuevo.length > 0 ? (
                                      carritoNuevo.map((item, index) => (
                                        <div key={index} className="text-xs text-gray-600">
                                          • {item.nombre} x{item.cantidad} = ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">Sin productos</div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-700">
                          <p><span className="font-medium">Modificado por:</span> {pedido.historial.modificado_por}</p>
                          <p><span className="font-medium">Fecha:</span> {new Date(pedido.historial.fecha_modificacion).toLocaleString('es-AR')}</p>
                        </div>
                        
                        {/* Botones de respuesta si el usuario no ha respondido aún */}
                        {pedido.estado === 'modificado' && (!pedido.historial.respuesta_usuario || pedido.historial.respuesta_usuario === null) && (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-300">
                            <p className="text-sm font-bold text-orange-800 mb-2">¿Qué deseas hacer con este pedido modificado?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => responderModificacion(pedido.id, 'aceptado')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1"
                              >
                                <i className="fas fa-check"></i>
                                Aceptar Cambios
                              </button>
                              <button
                                onClick={() => responderModificacion(pedido.id, 'rechazado')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1"
                              >
                                <i className="fas fa-times"></i>
                                Rechazar Pedido
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              ⏰ Tienes 10 minutos para responder antes de que el pedido se cancele automáticamente
                            </p>
                          </div>
                        )}
                        
                        {/* Mostrar respuesta si ya respondió */}
                        {pedido.historial.respuesta_usuario && (
                          <div className={`mt-4 p-3 rounded-lg border ${
                            pedido.historial.respuesta_usuario === 'aceptado' 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-red-50 border-red-300'
                          }`}>
                            <p className={`text-sm font-bold ${
                              pedido.historial.respuesta_usuario === 'aceptado' 
                                ? 'text-green-800' 
                                : 'text-red-800'
                            }`}>
                              {pedido.historial.respuesta_usuario === 'aceptado' ? '✅ Aceptaste los cambios' : '❌ Rechazaste el pedido'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {pedido.notas && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="font-bold text-yellow-800 mb-1">Notas:</h5>
                        <p className="text-sm text-yellow-700">{pedido.notas}</p>
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
