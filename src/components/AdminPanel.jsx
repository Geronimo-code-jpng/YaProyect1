import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../db/supabeClient';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  // Verificar autenticación y rol de admin
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { data, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        const session = data.session;
        
        if (!session) {
          navigate('/');
          return;
        }
        
        setCurrentUser(session.user);
        
        const { data: perfil, error: perfilError } = await supabaseClient
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single();
        
        if (perfilError) {
          setError("Error de permisos o base de datos: " + perfilError.message);
          setLoading(false);
          return;
        }

        if (!perfil || perfil.rol !== 'admin') {
          alert("🚨 Acceso denegado. Serás redirigido.");
          navigate('/');
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
  }, [navigate]);

  // Cargar pedidos
  const cargarPedidosAdmin = async () => {
    try {
      // Cargar todos los pedidos de la tabla 'pedidos' (incluyendo los web)
      const { data: todosLosPedidos, error } = await supabaseClient
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error cargando pedidos:", error);
        setPedidos([]);
        return;
      }
      
      // Procesar los datos para asegurar consistencia
      const pedidosProcesados = (todosLosPedidos || []).map(pedido => {
        // Asegurar que los pedidos web tengan los campos correctos
        if (pedido.fuente === 'web') {
          return {
            ...pedido,
            nombre_cliente: pedido.nombre_cliente || pedido.nombre,
            telefono: pedido.telefono,
            direccion: pedido.direccion,
            metodo_entrega: pedido.metodo || 'envio',
            items: pedido.carrito
          };
        }
        return pedido;
      });
      
      setPedidos(pedidosProcesados);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setPedidos([]);
    }
  };

  // Timer para actualizar cada 30 segundos
  useEffect(() => {
    const iniciarTimerGlobal = () => {
      if (timerInterval) clearInterval(timerInterval);
      
      const interval = setInterval(() => {
        cargarPedidosAdmin();
      }, 30000);
      
      setTimerInterval(interval);
    };

    if (!loading && pedidos.length > 0) {
      iniciarTimerGlobal();
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [loading, pedidos.length]);

  // Verificar pedidos vencidos cada minuto
  useEffect(() => {
    const verificarVencidos = async () => {
      try {
        const { data: pedidosPendientes, error } = await supabaseClient
          .from('pedidos')
          .select('id, expira_en')
          .eq('estado', 'pendiente')
          .eq('fuente', 'web');

        if (error) throw error;

        const ahora = new Date();
        for (const pedido of pedidosPendientes || []) {
          if (new Date(pedido.expira_en) < ahora) {
            await supabaseClient
              .from('pedidos')
              .update({ 
                estado: 'cancelado',
                horario: 'Pedido vencido por timeout de 10 minutos'
              })
              .eq('id', pedido.id);
          }
        }
        
        cargarPedidosAdmin();
      } catch (err) {
        console.error('Error verificando pedidos vencidos:', err);
      }
    };

    const interval = setInterval(verificarVencidos, 60000);
    return () => clearInterval(interval);
  }, []);

  const calcularTiempoRestante = (fechaVencimiento) => {
    const ahora = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento - ahora;
    return Math.max(0, Math.floor(diferencia / 1000));
  };

  const aceptarPedidoWeb = async (idPedido) => {
    if(!confirm(`¿Aceptar pedido #${idPedido}? Se marcará como aprobado.`)) return;
    
    try {
      const { error } = await supabaseClient
        .from('pedidos')
        .update({ 
          estado: 'aprobado',
          horario: 'Pedido aceptado por admin'
        })
        .eq('id', idPedido);
      
      if(error) throw error;
      
      alert(`✅ Pedido #${idPedido} aceptado correctamente`);
      cargarPedidosAdmin();
      
    } catch (err) {
      alert("Error al aceptar el pedido: " + err.message);
      console.error(err);
    }
  };

  const rechazarPedidoWeb = async (idPedido) => {
    if(!confirm(`¿Rechazar pedido #${idPedido}?`)) return;
    
    try {
      const { error } = await supabaseClient
        .from('pedidos')
        .update({ 
          estado: 'rechazado',
          horario: 'Pedido rechazado por admin'
        })
        .eq('id', idPedido);
      
      if(error) throw error;
      
      alert(`❌ Pedido #${idPedido} rechazado`);
      cargarPedidosAdmin();
    } catch (err) {
      alert("Error al rechazar el pedido: " + err.message);
      console.error(err);
    }
  };

  const cambiarEstado = async (idPedido, nuevoEstado) => {
    if(!confirm(`¿Marcar pedido #${idPedido} como ${nuevoEstado.toUpperCase()}?`)) return;
    
    try {
      const { error } = await supabaseClient
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', idPedido);
      
      if(error) throw error;
      
      alert(`¡Pedido ${nuevoEstado} con éxito!`);
      cargarPedidosAdmin();
    } catch (err) {
      alert("Error al cambiar el estado: " + err.message);
      console.error(err);
    }
  };

  const abrirModalModificar = (id) => {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) {
      alert('Pedido no encontrado');
      return;
    }
    
    let pedidoCopia = JSON.parse(JSON.stringify(pedido));
    
    if (typeof pedidoCopia.carrito === 'string') {
      pedidoCopia.carrito = JSON.parse(pedidoCopia.carrito);
    }

    pedidoCopia.carrito.forEach(item => {
      if (item.cantidad_original === undefined) {
        item.cantidad_original = item.cantidad;
      }
    });

    setPedidoEditando(pedidoCopia);
    setModalOpen(true);
  };

  const cerrarModalPedido = () => {
    setModalOpen(false);
    setPedidoEditando(null);
  };

  const cambiarCantidadModal = (index, cambio) => {
    if (pedidoEditando.carrito[index].cantidad + cambio >= 0) {
      const nuevoPedido = { ...pedidoEditando };
      nuevoPedido.carrito = [...nuevoPedido.carrito];
      nuevoPedido.carrito[index] = {
        ...nuevoPedido.carrito[index],
        cantidad: nuevoPedido.carrito[index].cantidad + cambio
      };
      
      let totalCalculado = 0;
      nuevoPedido.carrito.forEach(item => {
        totalCalculado += (item.precio * item.cantidad);
      });
      nuevoPedido.total = totalCalculado;
      
      setPedidoEditando(nuevoPedido);
    }
  };

  const eliminarDelModal = (index) => {
    const nuevoPedido = { ...pedidoEditando };
    nuevoPedido.carrito = [...nuevoPedido.carrito];
    nuevoPedido.carrito[index] = {
      ...nuevoPedido.carrito[index],
      cantidad: 0
    };
    
    let totalCalculado = 0;
    nuevoPedido.carrito.forEach(item => {
      totalCalculado += (item.precio * item.cantidad);
    });
    nuevoPedido.total = totalCalculado;
    
    setPedidoEditando(nuevoPedido);
  };

  const guardarModificacionPedido = async () => {
    try {
      const { error } = await supabaseClient
        .from('pedidos')
        .update({ 
          carrito: pedidoEditando.carrito, 
          total: pedidoEditando.total,
          estado: 'modificado'
        })
        .eq('id', pedidoEditando.id);

      if (error) throw error;
      
      alert("Pedido modificado correctamente.");
      cerrarModalPedido();
      cargarPedidosAdmin();
    } catch (err) {
      alert("Error guardando los cambios del pedido.");
      console.error(err);
    }
  };

  const cerrarSesionAdmin = async () => {
    await supabaseClient.auth.signOut();
    navigate('/');
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aprobado': 'bg-green-100 text-green-800',
      'configurado': 'bg-blue-100 text-blue-800',
      'modificado': 'bg-orange-100 text-orange-800',
      'rechazado': 'bg-red-100 text-red-800',
      'pagado': 'bg-purple-100 text-purple-800',
      'vencido': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`${badges[estado] || badges.pendiente} px-3 py-1 rounded-full font-bold text-xs uppercase`}>
        {estado || 'Pendiente'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-spinner fa-spin text-5xl text-[#FF6600] mb-4"></i>
        <p className="font-bold text-xl text-gray-500">Verificando credenciales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <p className="font-bold text-xl text-red-600">Error de permisos o base de datos</p>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="text-gray-800">
      <header className="bg-zinc-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-2xl font-black italic">YA</div>
            <h1 className="text-2xl font-black tracking-tight">ADMIN <span className="text-red-500">PANEL</span></h1>
          </div>
          <button 
            onClick={cerrarSesionAdmin}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-black text-zinc-800 mb-6 border-b-2 border-gray-300 pb-2">
          <i className="fas fa-inbox text-[#FF6600]"></i> Pedidos Recientes
        </h2>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                {pedidos.map(p => {
                  const tiempoRestante = p.fuente === 'web' && p.estado === 'pendiente' && p.expira_en 
                    ? calcularTiempoRestante(p.expira_en) 
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="p-4 font-black text-gray-500">
                        #{p.id}
                        {p.fuente === 'web' && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold text-xs ml-2">Web</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{p.nombre_cliente}</div>
                        <div className="text-xs text-gray-500"><i className="fas fa-phone"></i> {p.telefono}</div>
                        {(p.metodo === 'envio' || p.metodo_entrega === 'envio') ? (
                          <p className="text-sm font-bold text-blue-700 mt-2">
                            <i className="fas fa-map-marker-alt"></i> Dirección: {p.direccion || 'No especificó'}
                          </p>
                        ) : (
                          <p className="text-sm font-bold text-gray-500 mt-2">
                            <i className="fas fa-store"></i> Retira en Sucursal
                          </p>
                        )}
                        {p.fuente === 'web' && p.estado === 'pendiente' && p.expira_en && (
                          <div className="text-xs font-bold mt-1">
                            {tiempoRestante > 0 ? (
                              <div className="text-red-600">
                                <i className="fas fa-clock"></i> {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')} para vencer
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <i className="fas fa-clock"></i> Tiempo vencido
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-black text-[#FF6600]">${Number(p.total).toLocaleString('es-AR')}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase">
                          {p.metodo || p.metodo_entrega || 'envio'}
                        </div>
                      </td>
                      <td className="p-4">{getEstadoBadge(p.estado)}</td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {p.fuente === 'web' && p.estado === 'pendiente' && 
                          <>
                            <button 
                              onClick={() => aceptarPedidoWeb(p.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 h-8 rounded-full shadow text-xs font-black transition"
                            >
                              <i className="fas fa-check"></i> Aceptar
                            </button>
                            <button 
                              onClick={() => rechazarPedidoWeb(p.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 h-8 rounded-full shadow text-xs font-black transition"
                            >
                              <i className="fas fa-times"></i> Rechazar
                            </button>
                          </>
                        }
                        {p.fuente !== 'web' && (
                          <>
                            <button 
                              onClick={() => cambiarEstado(p.id, 'aprobado')}
                              className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full shadow" 
                              title="Aprobar"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button 
                              onClick={() => cambiarEstado(p.id, 'rechazado')}
                              className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full shadow" 
                              title="Rechazar"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => abrirModalModificar(p.id)}
                          className="bg-zinc-800 hover:bg-black text-white px-4 h-8 rounded-full shadow text-xs font-bold transition"
                        >
                          <i className="fas fa-eye mr-1"></i> Ver / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de edición */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <i className="fas fa-box-open text-[#FF6600]"></i> Pedido #{pedidoEditando.id}
              </h3>
              <button 
                onClick={cerrarModalPedido}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <div className="space-y-3">
                {pedidoEditando.carrito.map((item, index) => {
                  const estaEliminado = item.cantidad === 0;
                  const claseFondo = estaEliminado ? 'bg-red-50 opacity-60' : 'bg-white';
                  
                  return (
                    <div key={index} className={`${claseFondo} p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm`}>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">
                          {estaEliminado ? <><s>{item.nombre}</s> (Eliminado)</> : item.nombre}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Precio Unit: ${Number(item.precio).toLocaleString('es-AR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                          <button 
                            onClick={() => cambiarCantidadModal(index, -1)}
                            className="px-3 py-1 hover:bg-gray-200 font-black text-gray-600"
                            disabled={estaEliminado}
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-sm min-w-[30px] text-center">{item.cantidad}</span>
                          <button 
                            onClick={() => cambiarCantidadModal(index, 1)}
                            className="px-3 py-1 hover:bg-gray-200 font-black text-gray-600"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => eliminarDelModal(index)}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition" 
                          title="Quitar producto"
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
                <span className="font-bold text-gray-600">Total Modificado:</span>
                <span className="text-2xl font-black text-[#FF6600]">
                  ${pedidoEditando.total.toLocaleString('es-AR')}
                </span>
              </div>
              <button 
                onClick={guardarModificacionPedido}
                className="w-full bg-[#FF6600] hover:bg-orange-600 text-white font-black py-3 rounded-xl transition shadow-md flex justify-center items-center gap-2"
              >
                <i className="fas fa-save"></i> Guardar y Solicitar Aprobación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
