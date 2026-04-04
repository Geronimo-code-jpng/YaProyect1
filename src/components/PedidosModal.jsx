import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseClient } from '../db/supabeClient';

// Create a ref to store the openPedidos function
let openPedidosRef = null;

export default function PedidosModal() {
  const { user } = useAuth();
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

  const cargarPedidos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('pedidos')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
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
      'modificado': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Modificado' },
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
          <button 
            onClick={closePedidos}
            className="text-4xl text-gray-400 hover:text-black leading-none"
          >
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-10">
              <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
              <p className="text-lg font-bold text-gray-500">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
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
                        <h4 className="font-black text-lg">Pedido #{pedido.id}</h4>
                        <p className="text-gray-600 text-sm">
                          {new Date(pedido.created_at).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">Productos:</h5>
                        <div className="space-y-2">
                          {(pedido.items || []).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.nombre} x{item.cantidad}</span>
                              <span className="font-black">${item.precio.toLocaleString('es-AR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">Resumen:</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${pedido.subtotal?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>${pedido.envio?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                          <div className="flex justify-between font-black text-lg border-t pt-2">
                            <span>Total:</span>
                            <span className="text-[#FF6600]">${pedido.total?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
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
