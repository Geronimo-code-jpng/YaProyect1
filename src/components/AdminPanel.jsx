import { useState, useEffect, useRef, useCallback } from "react";
import { supabase as supabaseClient } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import ProductModal from "./ProductModal";
import { verTodosLosProductos, eliminarProductoPorId, eliminarTodosLosProductos, exportarProductos } from "../utils/productManager";
import "../utils/initProductManager";
import { processProductImageReplacement } from "../utils/imageFileHandler";

// Componente de confirmación con razón personalizada para rechazo
function RejectDialog({ message, onConfirm, onCancel }) {
  const [razon, setRazon] = useState("");

  const handleConfirm = () => {
    if (razon.trim()) {
      onConfirm(razon.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <p className="text-gray-800 font-bold text-center mb-4">{message}</p>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Razón del rechazo (obligatorio):
          </label>
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
            placeholder="Ej: No tenemos stock de los productos solicitados"
            rows="3"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-black rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!razon.trim()}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rechazar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de confirmación inline (reemplaza alert/confirm nativos)
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
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
      className={`fixed top-5 right-5 z-9999 ${colors[type] || colors.info} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold`}
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
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos', 'productos', o 'configuracion'
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [rejectDialog, setRejectDialog] = useState(null); // { message, onConfirm }
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const timerRef = useRef(null);
  const [tiempoActual, setTiempoActual] = useState(Date.now());
  const [shippingPrice, setShippingPrice] = useState(7200);
  const [tempShippingPrice, setTempShippingPrice] = useState('7200');

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, [setToast]);

  const showConfirm = useCallback((message, onConfirm) => {
    setConfirm({ message, onConfirm });
  }, [setConfirm]);

  
  // Cargar precio de envío desde la base de datos
  const loadShippingPrice = useCallback(async () => {
    console.log('=== CARGANDO PRECIO DE ENVÍO ===');
    try {
      console.log('Buscando configuración en la base de datos...');
      const { data: config, error } = await supabaseClient
        .from('configuracion')
        .select('precio_envio')
        .eq('id', 1)
        .single();
      
      console.log('Resultado de carga:', { config, error });
      
      if (error) {
        console.error('Error cargando precio de envío:', error);
        // Fallback a localStorage si hay error
        const savedPrice = localStorage.getItem('shippingPrice');
        console.log('Fallback a localStorage, precio guardado:', savedPrice);
        if (savedPrice) {
          const price = parseInt(savedPrice, 10);
          setShippingPrice(price);
          setTempShippingPrice(price.toString());
          console.log('Precio desde localStorage aplicado:', price);
        }
        return;
      }
      
      if (config && config.precio_envio) {
        const price = config.precio_envio;
        console.log('Precio desde base de datos:', price);
        setShippingPrice(price);
        setTempShippingPrice(price.toString());
        // También guardar en localStorage como backup
        localStorage.setItem('shippingPrice', price.toString());
        console.log('Precio aplicado y guardado en localStorage:', price);
      } else {
        console.log('No se encontró configuración o precio_envio es nulo');
      }
    } catch (error) {
      console.error('Error cargando precio de envío:', error);
    }
    console.log('=== FIN CARGA PRECIO ENVÍO ===');
  }, []);

  // Guardar precio de envío en la base de datos
  const saveShippingPrice = useCallback(async () => {
    console.log('=== GUARDANDO PRECIO DE ENVÍO ===');
    console.log('Precio temporal a guardar:', tempShippingPrice);
    
    const newPrice = parseInt(tempShippingPrice, 10);
    console.log('Precio parseado:', newPrice);
    
    if (isNaN(newPrice) || newPrice < 0) {
      console.error('Precio inválido:', newPrice);
      showToast('Por favor ingresa un precio válido', 'error');
      return;
    }
    
    try {
      console.log('Actualizando base de datos con precio:', newPrice);
      const { data: updateData, error } = await supabaseClient
        .from('configuracion')
        .update({
          precio_envio: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select();
      
      console.log('Resultado de actualización:', { updateData, error });
      
      if (error) {
        console.error('Error guardando precio de envío:', error);
        showToast('Error al guardar el precio de envío', 'error');
        return;
      }
      
      console.log('Actualización exitosa, actualizando estado...');
      setShippingPrice(newPrice);
      localStorage.setItem('shippingPrice', newPrice.toString()); // Backup
      console.log('Estado actualizado, precio guardado:', newPrice);
      showToast('Precio de envío actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error guardando precio de envío:', error);
      showToast('Error al guardar el precio de envío', 'error');
    }
    console.log('=== FIN GUARDADO PRECIO ENVÍO ===');
  }, [tempShippingPrice, showToast]);

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
  }, [setPedidos]);

  // Verificar autenticación y rol de admin
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        // Obtener sesión actual del localStorage
        const storedSession = localStorage.getItem('userSession');
        if (!storedSession) {
          navigate("/");
          return;
        }

        const userSession = JSON.parse(storedSession);
        
        // Verificar que la sesión sea válida (no expirada)
        const loginTime = new Date(userSession.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24 || !userSession.isLoggedIn) {
          localStorage.removeItem('userSession');
          navigate("/");
          return;
        }

        setCurrentUser(userSession);

        // Verificar rol en la base de datos
        const { data: perfil, error: perfilError } = await supabaseClient
          .from("perfiles")
          .select("rol")
          .eq("id", userSession.id)
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

  // Timer para actualizar tiempo restante en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

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
    const diferencia = new Date(fechaVencimiento) - new Date(tiempoActual);
    return Math.max(0, Math.floor(diferencia / 1000));
  };

  // Funciones para gestión de productos
  const cargarProductos = useCallback(async () => {
    setProductLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from("productos")
        .select("*")
        .order("Id");
      
      if (error) throw error;
      
      console.log("=== PRODUCTOS CARGADOS ===");
      console.log("Cantidad de productos:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("Campos del primer producto:", Object.keys(data[0]));
        console.log("Usando imágenes estáticas desde /products/");
      }
      
      setProducts(data || []);
    } catch (err) {
      console.error("Error cargando productos:", err);
      showToast("Error cargando productos", "error");
    } finally {
      setProductLoading(false);
    }
  }, [setProductLoading, setProducts, showToast]);

  const abrirModalProducto = (producto = null) => {
    setEditingProduct(producto);
    setProductModalOpen(true);
  };

  const cerrarModalProducto = () => {
    setEditingProduct(null);
    setProductModalOpen(false);
  };

  const guardarProducto = async (productoData) => {
    try {
      let imageUrl = null;

      // Si hay un archivo de imagen y estamos editando, procesar la subida
      if (productoData.imageFile && editingProduct) {
        console.log(`Procesando subida de imagen para producto: ${editingProduct.nombre}`);
        
        try {
          const replacementResult = await processProductImageReplacement(
            productoData.imageFile, 
            editingProduct
          );
          
          if (replacementResult.success) {
            imageUrl = replacementResult.imageUrl;
            console.log(`Imagen subida exitosamente: ${imageUrl}`);
            
            // Mostrar notificación de éxito
            showToast(
              `Imagen "${replacementResult.fileName}" subida exitosamente a Supabase Storage`, 
              "success",
              4000
            );
          } else {
            throw new Error(replacementResult.message);
          }
        } catch (error) {
          console.error("Error subiendo imagen:", error);
          showToast("Error subiendo la imagen: " + error.message, "error");
          return;
        }
      }

      // Preparar datos para guardar en la base de datos
      const dataToSave = {
        nombre: productoData.nombre,
        precio: productoData.precio,
        Categoria: productoData.Categoria,
        Oferta: productoData.Oferta,
        Stock: productoData.Stock
      };
      
      // Lógica para manejar la imagen:
      if (imageUrl) {
        // Si se subió una nueva imagen, usar la nueva URL
        dataToSave.Imagen = imageUrl;
      } else if (editingProduct && (editingProduct.Imagen || editingProduct.imagen)) {
        // Si estamos editando y no se subió nueva imagen, mantener la existente
        dataToSave.Imagen = editingProduct.Imagen || editingProduct.imagen;
        console.log("Manteniendo imagen existente:", dataToSave.Imagen);
      }
      // Si es un producto nuevo y no se subió imagen, no se incluye el campo Imagen
      
      // Eliminar campos que no existen o son nulos/vacíos
      if (!dataToSave.Oferta || dataToSave.Oferta.trim() === '') delete dataToSave.Oferta;
      // Siempre incluir Stock como booleano (true/false)
      if (dataToSave.Stock === undefined || dataToSave.Stock === null) {
        dataToSave.Stock = false; // Valor por defecto
      }

      console.log("Guardando producto:", dataToSave);
      console.log("Editando producto:", editingProduct);

      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabaseClient
          .from("productos")
          .update(dataToSave)
          .eq("Id", editingProduct.Id);
        
        if (error) {
          console.error("Error de Supabase actualizando:", error);
          throw error;
        }
        
        // Mensaje personalizado según si se cambió la imagen o no
        if (imageUrl) {
          showToast("Producto actualizado exitosamente con nueva imagen", "success");
        } else if (editingProduct.Imagen || editingProduct.imagen) {
          showToast("Producto actualizado exitosamente (imagen mantenida)", "success");
        } else {
          showToast("Producto actualizado exitosamente", "success");
        }
      } else {
        // Crear nuevo producto
        // Generar un ID numérico único para el nuevo producto (int8)
        const nuevoId = Date.now(); // Timestamp actual como número entero
        const dataToInsert = {
          ...dataToSave,
          Id: nuevoId
        };
        
        const { error } = await supabaseClient
          .from("productos")
          .insert(dataToInsert);
        
        if (error) {
          console.error("Error de Supabase insertando:", error);
          throw error;
        }
        showToast("Producto creado exitosamente", "success");
      }
      
      await cargarProductos();
      cerrarModalProducto();
    } catch (err) {
      console.error("Error guardando producto:", err);
      showToast(`Error guardando producto: ${err.message}`, "error");
    }
  };

  const eliminarProducto = async (productoId) => {
    if (!productoId) {
      showToast("ID de producto no válido", "error");
      return;
    }

    showConfirm(
      "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.",
      async () => {
        setConfirm(null);
        try {
          console.log("Eliminando producto con ID:", productoId);
          
          const { error } = await supabaseClient
            .from("productos")
            .delete()
            .eq("Id", productoId);
          
          if (error) {
            console.error("Error de Supabase:", error);
            throw error;
          }
          
          showToast("Producto eliminado exitosamente", "success");
          await cargarProductos(); // Recargar la lista
        } catch (err) {
          console.error("Error eliminando producto:", err);
          showToast(`Error eliminando producto: ${err.message}`, "error");
        }
      }
    );
  };

  // Probar conexión a la base de datos
  const testDatabaseConnection = useCallback(async () => {
    console.log('=== PROBANDO CONEXIÓN A BASE DE DATOS ===');
    try {
      console.log('Intentando leer tabla configuracion...');
      const { data, error } = await supabaseClient
        .from('configuracion')
        .select('*')
        .limit(1);
      
      console.log('Resultado de prueba de conexión:', { data, error });
      
      if (error) {
        console.error('Error en prueba de conexión:', error);
        if (error.code === 'PGRST116') {
          console.error('La tabla no existe o no hay permisos para leerla');
        } else if (error.code === 'PGRST301') {
          console.error('Error de permisos RLS - revisa las políticas');
        }
      } else {
        console.log('Conexión exitosa a la base de datos');
      }
    } catch (err) {
      console.error('Error general en prueba de conexión:', err);
    }
    console.log('=== FIN PRUEBA CONEXIÓN ===');
  }, []);

  // Cargar precio de envío al montar el componente
  useEffect(() => {
    testDatabaseConnection();
    loadShippingPrice();
  }, [testDatabaseConnection, loadShippingPrice]);

  // Cargar productos cuando se cambia a la pestaña de productos
  useEffect(() => {
    if (activeTab === 'productos' && products.length === 0) {
      cargarProductos();
    }
  }, [activeTab, cargarProductos, products.length]);

  const configurarPedido = (idPedido) => {
    showConfirm(
      `¿Configurar pedido #${idPedido}? Se iniciarán 10 minutos para pagar.\n\n⚠️ Esta acción enviará una notificación al cliente.`,
      async () => {
        setConfirm(null);
        try {
          // Verificar que el pedido exista y esté en estado pendiente
          const { data: pedido, error: fetchError } = await supabaseClient
            .from("pedidos")
            .select("*")
            .eq("id", idPedido)
            .single();

          if (fetchError || !pedido) {
            showToast("❌ Pedido no encontrado", "error");
            return;
          }

          if (pedido.estado !== "pendiente") {
            showToast(`❌ El pedido ya está configurado o tiene otro estado: ${pedido.estado}`, "error");
            return;
          }

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
          
          // Enviar notificación WhatsApp al cliente
          await enviarWhatsAppConfiguracion(pedido);
          
        } catch (err) {
          console.error("Error configurando pedido:", err);
          showToast("Error al configurar el pedido: " + err.message, "error");
        }
      },
    );
  };

  const marcarPagado = (idPedido) => {
    showConfirm(
      `¿Confirmar pago manual del pedido #${idPedido}?\n\n⚠️ Esta acción marcará el pedido como pagado y enviará notificación al cliente.`,
      async () => {
        setConfirm(null);
        try {
          // Obtener datos del pedido antes de actualizar
          const { data: pedido, error: fetchError } = await supabaseClient
            .from("pedidos")
            .select("*")
            .eq("id", idPedido)
            .single();

          if (fetchError || !pedido) {
            showToast("❌ Pedido no encontrado", "error");
            return;
          }

          if (pedido.estado === "pagado") {
            showToast("❌ El pedido ya está marcado como pagado", "error");
            return;
          }

          const { error } = await supabaseClient
            .from("pedidos")
            .update({ 
              estado: "pagado",
              pagado_manualmente: true,
              fecha_pago: new Date().toISOString(),
              pagado_por: currentUser?.email
            })
            .eq("id", idPedido);

          if (error) throw error;

          // Enviar WhatsApp de confirmación
          await enviarWhatsAppConfirmacion(pedido);

          showToast(`✅ Pedido #${idPedido} marcado como pagado y notificado.`);
          cargarPedidosAdmin();
        } catch (err) {
          console.error("Error marcando como pagado:", err);
          showToast("Error al marcar como pagado: " + err.message, "error");
        }
      },
    );
  };

  const cambiarEstado = (idPedido, nuevoEstado) => {
    const mensajesEstado = {
      aprobado: "¿Aprobar este pedido? Se enviará confirmación al cliente.",
      cancelado: "¿Cancelar este pedido? Se notificará al cliente."
    };

    if (nuevoEstado === "rechazado") {
      // Mostrar modal de rechazo con razón personalizada
      setRejectDialog({
        message: `¿Rechazar este pedido #${idPedido}? Por favor, indica la razón del rechazo.`,
        onConfirm: async (razon) => {
          setRejectDialog(null);
          await procesarCambioEstado(idPedido, nuevoEstado, razon);
        }
      });
    } else {
      // Usar el diálogo normal para otros estados
      showConfirm(
        `${mensajesEstado[nuevoEstado] || `¿Marcar pedido #${idPedido} como ${nuevoEstado.toUpperCase()}?`}`,
        async () => {
          setConfirm(null);
          await procesarCambioEstado(idPedido, nuevoEstado);
        }
      );
    }
  };

  const procesarCambioEstado = async (idPedido, nuevoEstado, razon = "") => {
    try {
      // Verificar que el pedido exista
      const { data: pedido, error: fetchError } = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("id", idPedido)
        .single();

      if (fetchError || !pedido) {
        showToast("❌ Pedido no encontrado", "error");
        return;
      }

      // Validar transiciones de estado
      if (nuevoEstado === "aprobado" && pedido.estado !== "pendiente") {
        showToast("❌ Solo se pueden aprobar pedidos pendientes", "error");
        return;
      }

          const updateData = {
        estado: nuevoEstado,
        modificado_por: currentUser?.email,
        fecha_modificacion: new Date().toISOString()
      };

      // Si se aprueba, iniciar temporizador de pago
      if (nuevoEstado === "aprobado") {
        const fechaVencimiento = new Date(Date.now() + 10 * 60 * 1000);
        updateData.expira_en = fechaVencimiento.toISOString();
        updateData.estado = "configurado";
      }

      const { error } = await supabaseClient
        .from("pedidos")
        .update(updateData)
        .eq("id", idPedido);

      if (error) throw error;
      
      const estadoFinal = nuevoEstado === "aprobado" ? "configurado" : nuevoEstado;
      showToast(`✅ Pedido ${estadoFinal} con éxito!`);
      cargarPedidosAdmin();
      
      // Enviar notificación si es necesario
      if (nuevoEstado === "aprobado") {
        await enviarWhatsAppConfiguracion(pedido);
      } else if (nuevoEstado === "rechazado" || nuevoEstado === "cancelado") {
        await enviarWhatsAppRechazo(pedido, nuevoEstado, razon);
      }
      
    } catch (err) {
      console.error(`Error cambiando estado a ${nuevoEstado}:`, err);
      showToast("Error al cambiar el estado: " + err.message, "error");
    }
  };

  const abrirModalModificar = (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    // Asegurar copia profunda para no mutar el original
    const pedidoCopia = JSON.parse(JSON.stringify(pedido));
    
    // Manejar el carrito correctamente
    if (typeof pedidoCopia.carrito === "string") {
      try {
        pedidoCopia.carrito = JSON.parse(pedidoCopia.carrito);
      } catch {
        pedidoCopia.carrito = [];
      }
    }
    if (!Array.isArray(pedidoCopia.carrito)) pedidoCopia.carrito = [];

    // Asegurar que todos los items tengan todas las propiedades necesarias
    pedidoCopia.carrito = pedidoCopia.carrito.map(item => ({
      ...item,
      cantidad_original: item.cantidad,
      subtotal: (item.precio_unitario || item.precio || 0) * item.cantidad
    }));

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
      (acc, item) => acc + item.precio_unitario * item.cantidad,
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

  const enviarWhatsAppConfiguracion = async (pedido) => {
    try {
      const message =
        `⏰ *TU PEDIDO ESTÁ LISTO PARA PAGAR*\n\n` +
        `📦 *Pedido #${pedido.id}*\n` +
        `👤 *Cliente:* ${pedido.nombre_cliente}\n\n` +
        `💰 *Total:* $${Number(pedido.total).toLocaleString("es-AR")}\n\n` +
        `⚡ *¡Tu pedido ha sido aceptado!*\n` +
        `⏰ Tenés 10 minutos para completar el pago\n` +
        `💳 Puedes pagar con Mercado Pago o transferencia\n\n` +
        `📦 Te enviaremos actualizaciones por este medio`;

      const telefonoFormateado = pedido.telefono
        .replace(/\D/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Error enviando WhatsApp de configuración:", error);
    }
  };

  const enviarWhatsAppRechazo = async (pedido, tipo, razon = "") => {
    try {
      const mensaje = tipo === 'rechazado' 
        ? `❌ *TU PEDIDO HA SIDO RECHAZADO*\n\n📦 *Pedido #${pedido.id}*\n👤 *Cliente:* ${pedido.nombre_cliente}\n\n⚠️ *Lamentamos informarte que tu pedido no ha sido aprobado.*\n\n📝 *Razón del rechazo:*\n${razon}\n\n❓ *¿Tienes dudas?* Contáctanos para más información.`
        : `❌ *TU PEDIDO HA SIDO CANCELADO*\n\n📦 *Pedido #${pedido.id}*\n👤 *Cliente:* ${pedido.nombre_cliente}\n\n⚠️ *Tu pedido ha sido cancelado.*\n\n${razon ? `📝 *Motivo:*\n${razon}\n\n` : ''}❓ *¿Tienes dudas?* Contáctanos para más información.`;

      const telefonoFormateado = pedido.telefono
        .replace(/\D/g, "")
        .replace(/^0/, "");
      const whatsappUrl = `https://wa.me/549${telefonoFormateado}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Error enviando WhatsApp de rechazo:", error);
    }
  };

  const enviarWhatsAppConfirmacion = async (pedido) => {
    try {
      // Obtener lista de productos del carrito
      let productos = [];
      if (typeof pedido.carrito === "string") {
        try {
          productos = JSON.parse(pedido.carrito);
        } catch (e) {
          productos = [];
          console.error("Error parsing carrito:", e);
        }
      } else if (Array.isArray(pedido.carrito)) {
        productos = pedido.carrito;
      }

      // Crear lista de productos para el mensaje
      const listaProductos = productos
        .map(
          (p) => {
            const subtotal = p.precio * p.cantidad;
            const impuestos = subtotal * 0.08;
            const total = subtotal + impuestos;
            return `• ${p.nombre} x${p.cantidad} = $${subtotal.toLocaleString("es-AR")} +8% impuestos: $${impuestos.toFixed(2)} (Total: $${total.toLocaleString("es-AR")})`;
          }
        )
        .join("\n");

      const message =
        `✅ *TU PEDIDO HA SIDO CONFIRMADO*\n\n` +
        `📦 *Pedido #${pedido.id}*\n` +
        `👤 *Cliente:* ${pedido.nombre_cliente}\n\n` +
        `🛒 *Tus productos:*\n${listaProductos}\n\n` +
        `💰 *Total:* $${Number(pedido.total).toLocaleString("es-AR")}\n\n` +
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

      {/* Reject dialog */}
      {rejectDialog && (
        <RejectDialog
          message={rejectDialog.message}
          onConfirm={rejectDialog.onConfirm}
          onCancel={() => setRejectDialog(null)}
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

        {/* Pestañas de navegación */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'pedidos'
                  ? 'border-[#FF6600] text-[#FF6600]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'productos'
                  ? 'border-[#FF6600] text-[#FF6600]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'configuracion'
                  ? 'border-[#FF6600] text-[#FF6600]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuración
            </button>
          </nav>
        </div>

        {/* Contenido de la pestaña activa */}
        {activeTab === 'pedidos' && (
          <div>
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
                                <i className="fas fa-cog"></i> Aceptar
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
                            <button
                              onClick={() => abrirModalModificar(p.id)}
                              className="bg-zinc-800 hover:bg-black text-white px-3 py-2 rounded-lg shadow text-xs font-bold transition flex items-center gap-1"
                            >
                              <i className="fas fa-eye"></i> Ver
                            </button>
                            {p.fuente === "web" && p.estado === "pendiente" && (
                              <>
                                <button
                                  onClick={() =>
                                    cambiarEstado(p.id, "rechazado")
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow text-xs font-bold transition flex items-center gap-1"
                                  title="Rechazar"
                                >
                                  <i className="fas fa-times"></i> Rechazar
                                </button>
                              </>
                            )}
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
      </div>
      )}

      {/* Sección de Productos */}
      {activeTab === 'productos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
              <i className="fas fa-box text-[#FF6600]"></i>
              Productos
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={cargarProductos}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
                title="Refrescar productos"
              >
                <i className="fas fa-sync-alt"></i>
                Refrescar
              </button>
              <button
                onClick={() => abrirModalProducto()}
                className="bg-[#FF6600] hover:bg-orange-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2 shadow-md"
              >
                <i className="fas fa-plus"></i>
                Nuevo Producto
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Ver todos los productos en la consola?')) {
                    verTodosLosProductos();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
                title="Ver productos en consola"
              >
                <i className="fas fa-list"></i>
                Ver Productos
              </button>
              <button
                onClick={() => {
                  const id = prompt('Ingrese ID del producto a eliminar:');
                  if (id && !isNaN(id)) {
                    if (confirm(`¿Eliminar producto con ID ${id}?`)) {
                      eliminarProductoPorId(parseInt(id)).then(success => {
                        if (success) {
                          cargarProductos();
                        }
                      });
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
                title="Eliminar producto por ID"
              >
                <i className="fas fa-trash"></i>
                Eliminar
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Exportar productos a la consola?')) {
                    exportarProductos();
                  }
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold transition text-sm flex items-center gap-2"
                title="Exportar productos"
              >
                <i className="fas fa-download"></i>
                Exportar
              </button>
            </div>
          </div>

          {productLoading ? (
            <div className="text-center py-20">
              <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
              <p className="text-lg font-bold text-gray-500">Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <i className="fas fa-box-open text-6xl mb-4"></i>
              <p className="text-lg font-bold">No hay productos</p>
              <p className="text-gray-500 mt-2">Comienza agregando tu primer producto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-black">ID</th>
                    <th className="p-4 font-black">Imagen</th>
                    <th className="p-4 font-black">Nombre</th>
                    <th className="p-4 font-black">Categoría</th>
                    <th className="p-4 font-black">Precio</th>
                    <th className="p-4 font-black">Stock</th>
                    <th className="p-4 font-black">Oferta</th>
                    <th className="p-4 font-black">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    
                    return (
                    <tr key={product.Id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{product.Id}</td>
                      <td className="p-4">
                        <img
                          src={product.Imagen || product.imagen || `https://via.placeholder.com/48/f3f4f6/a1a1aa?text=${product.Id}`}
                          alt={product.nombre}
                          className="w-12 h-12 object-contain rounded-lg"
                          onError={(e) => {
                            console.error(`Error cargando imagen para producto ${product.Id}`);
                            e.target.src = `https://via.placeholder.com/48/f3f4f6/a1a1aa?text=${product.Id}`;
                          }}
                          title={product.Imagen || product.imagen ? 'Imagen de Supabase Storage' : 'Sin imagen'}
                        />
                      </td>
                      <td className="p-4 font-medium">{product.nombre}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-black">
                          {product.Categoria}
                        </span>
                      </td>
                      <td className="p-4 font-black text-green-600">
                        ${product.precio?.toLocaleString('es-AR')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-black ${
                          product.Stock 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.Stock ? 'Verdadero' : 'Falso'}
                        </span>
                      </td>
                      <td className="p-4">
                        {product.Oferta ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">
                            {product.Oferta}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModalProducto(product)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition"
                            title="Editar"
                          >
                            <i className="fas fa-edit">Editar</i>
                          </button>
                          <button
                            onClick={() => eliminarProducto(product.Id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash">Eliminar</i>
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
      )}

      {/* Sección de Configuración */}
      {activeTab === 'configuracion' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
              <i className="fas fa-cog text-[#FF6600]"></i>
              Configuración
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-truck text-[#FF6600]"></i>
                Precio de Envío
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Precio actual de envío:
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-green-600">
                      ${shippingPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      (precio vigente)
                    </span>
                    <button
                      onClick={testDatabaseConnection}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition"
                      title="Probar conexión a base de datos"
                    >
                      <i className="fas fa-database">Probar DB</i>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nuevo precio de envío:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        value={tempShippingPrice}
                        onChange={(e) => setTempShippingPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-bold text-lg"
                        placeholder="7200"
                        min="0"
                        step="100"
                      />
                    </div>
                    <button
                      onClick={saveShippingPrice}
                      className="bg-[#FF6600] hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center gap-2"
                    >
                      <i className="fas fa-save"></i>
                      Actualizar Precio
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Este cambio afectará todos los pedidos nuevos realizados desde la web
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Modal de edición */}
      {modalOpen && pedidoEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-2"></div>
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
                className="text-4xl text-white hover:text-gray-400 cursor-pointer leading-none"
              >
                &times;
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
                          ${Number(item.precio_unitario || item.precio || 0).toLocaleString("es-AR")} c/u
                          {item.cantidad > 0 && (
                            <span className="ml-2 text-gray-700 font-bold">
                              = $
                              {(
                                (Number(item.precio_unitario || item.precio || 0) * item.cantidad)
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

      {/* Modal de Productos */}
      <ProductModal
        key={editingProduct?.id || 'new'}
        isOpen={productModalOpen}
        onClose={cerrarModalProducto}
        product={editingProduct}
        onSave={guardarProducto}
      />
    </div>
  );
};

export default AdminPanel;
