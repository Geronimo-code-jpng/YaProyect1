import { useState, useEffect, useRef, useCallback } from "react";
import { supabase as supabaseClient } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import ProductModal from "./ProductModal";
import { useProducts } from "../../contexts/ProductContext";

import "../../utils/productManager";
import { processProductImageReplacement } from "../../utils/imageFileHandler";
import RejectDialog from "./RejectDialog";
import ConfirmDialog from "./ConfirmDialog";
import Toast from "./Toast";
import { validateCartItems } from "../../utils/validateCartItems";
import type { PriceChange } from "../../utils/validateCartItems";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { loadProductsForAdmin } = useProducts();
  const [currentUser, setCurrentUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pedidos"); // 'pedidos', 'productos', o 'configuracion'
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState<any>();
  const [productLoading, setProductLoading] = useState(false);
  const [loadingProductId] = useState(null);
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
  const [tempShippingPrice, setTempShippingPrice] = useState("7200");
  const [bancoInfo, setBancoInfo] = useState({
    banco: "",
    titular: "",
    alias: "",
    cbu: "",
  });
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [priceComparison, setPriceComparison] = useState<{
    results: PriceChange[];
    loading: boolean;
    show: boolean;
  }>({ results: [], loading: false, show: false });

  const showToast = useCallback(
    (message, type = "success") => {
      setToast({ message, type });
    },
    [setToast],
  );

  const showConfirm = useCallback(
    (message, onConfirm) => {
      setConfirm({ message, onConfirm });
    },
    [setConfirm],
  );

  // Cargar precio de envío desde la base de datos
  const loadShippingPrice = useCallback(async () => {
    try {
      const { data: config, error } = await supabaseClient
        .from("configuracion")
        .select("precio_envio")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error cargando precio de envío:", error);
        // Fallback a localStorage si hay error
        const savedPrice = localStorage.getItem("shippingPrice");
        if (savedPrice) {
          const price = parseInt(savedPrice, 10);
          setShippingPrice(price);
          setTempShippingPrice(price.toString());
        }
        return;
      }

      if (config && config.precio_envio) {
        const price = config.precio_envio;
        setShippingPrice(price);
        setTempShippingPrice(price.toString());
      } else {
        throw Error("No se encontró configuración o precio_envio es nulo");
      }
    } catch (error) {
      throw Error(error);
    }
  }, []);

  const getProductById = async (productId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("productos")
        .select("*")
        .eq("Id", productId)
        .single();

      if (error) {
        console.error("Error: ", error);
        return;
      }
      setProduct(data);

      // Set quantity per bundle from productos table
      // setProductQuantityPerBundle(data.quantity || 1);
    } catch (error) {
      console.error(error);
    }
  };

  // Guardar precio de envío en la base de datos
  const saveShippingPrice = useCallback(async () => {
    const newPrice = parseInt(tempShippingPrice, 10);
    if (isNaN(newPrice) || newPrice < 0) {
      console.error("Precio inválido:", newPrice);
      showToast("Por favor ingresa un precio válido", "error");
      return;
    }

    try {
      const { data: updateData, error } = await supabaseClient
        .from("configuracion")
        .update({
          precio_envio: newPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select();

      if (error) {
        console.error("Error guardando precio de envío:", error);
        showToast("Error al guardar el precio de envío", "error");
        return;
      }

      setShippingPrice(newPrice);
      showToast("Precio de envío actualizado correctamente", "success");
    } catch (error) {
      console.error("Error guardando precio de envío:", error);
      showToast("Error al guardar el precio de envío", "error");
    }
  }, [tempShippingPrice, showToast]);

  // Cargar datos bancarios
  const loadBankConfig = useCallback(async () => {
    try {
      const { data: config, error } = await supabaseClient
        .from("configuracion")
        .select("banco, titular, alias, cbu")
        .eq("id", 1)
        .single();
      if (!error && config) {
        setBancoInfo({
          banco: config.banco || "",
          titular: config.titular || "",
          alias: config.alias || "",
          cbu: config.cbu || "",
        });
      }
    } catch (err) {
      console.error("Error cargando datos bancarios:", err);
    }
  }, []);

  // Guardar datos bancarios
  const saveBankConfig = useCallback(async () => {
    try {
      const { error } = await supabaseClient
        .from("configuracion")
        .update({
          banco: bancoInfo.banco,
          titular: bancoInfo.titular,
          alias: bancoInfo.alias,
          cbu: bancoInfo.cbu,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) {
        showToast("Error al guardar datos bancarios", "error");
        return;
      }
      showToast("Datos bancarios guardados correctamente", "success");
    } catch (err) {
      console.error("Error guardando datos bancarios:", err);
      showToast("Error al guardar datos bancarios", "error");
    }
  }, [bancoInfo, showToast]);

  const loadCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from("categorias")
        .select("*")
        .order("categoria", { ascending: true });
      if (!error && data) setCategorias(data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }, []);

  const agregarCategoria = async () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) {
      showToast("Ingresá un nombre para la categoría", "error");
      return;
    }
    try {
      const { error } = await supabaseClient
        .from("categorias")
        .insert({ categoria: nombre });
      if (error) {
        showToast("Error al agregar categoría: " + error.message, "error");
        return;
      }
      setNuevaCategoria("");
      await loadCategorias();
      showToast(`Categoría "${nombre}" agregada`, "success");
    } catch (err) {
      showToast("Error al agregar categoría", "error");
    }
  };

  const eliminarCategoria = async (id, nombre) => {
    showConfirm(`¿Eliminar la categoría "${nombre}"?`, async () => {
      setConfirm(null);
      try {
        const { error } = await supabaseClient
          .from("categorias")
          .delete()
          .eq("id", id);
        if (error) {
          showToast("Error al eliminar categoría", "error");
          return;
        }
        await loadCategorias();
        showToast(`Categoría "${nombre}" eliminada`, "success");
      } catch (err) {
        showToast("Error al eliminar categoría", "error");
      }
    });
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
  }, [setPedidos]);

  // Verificar autenticación y rol de admin
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        // Obtener sesión actual del localStorage
        const storedSession = localStorage.getItem("userSession");
        if (!storedSession) {
          navigate("/");
          return;
        }

        const userSession = JSON.parse(storedSession);

        // Verificar que la sesión sea válida (no expirada)
        const loginTime = new Date(userSession.loginTime);
        const now = new Date();
        const hoursDiff = (Number(now) - Number(loginTime)) / (1000 * 60 * 60);

        if (hoursDiff > 24 || !userSession.isLoggedIn) {
          localStorage.removeItem("userSession");
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
    const diferencia = Number(new Date(fechaVencimiento)) - Number(new Date(tiempoActual));
    return Math.max(0, Math.floor(diferencia / 1000));
  };

  // Funciones para gestión de productos
  const cargarProductos = useCallback(async () => {
    setProductLoading(true);
    try {
      const productos = await loadProductsForAdmin();
      setProducts(productos);
    } catch (error) {
      console.error("Error cargando productos:", error);
      showToast("Error al cargar productos", "error");
    } finally {
      setProductLoading(false);
    }
  }, [loadProductsForAdmin]);

  const updateProductFlag = async (productId, field, value) => {
    try {
      const { error } = await supabaseClient
        .from("productos")
        .update({ [field]: value })
        .eq("Id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((product) =>
          product.Id === productId ? { ...product, [field]: value } : product,
        ),
      );
    } catch (error) {
      console.error(`Error actualizando ${field}:`, error);
      showToast(`Error al actualizar`, "error");
    }
  };

  const updateProductQuantity = async (productId, quantity) => {
    try {
      // Update quantity directly in productos table
      const { error } = await supabaseClient
        .from("productos")
        .update({ quantity: quantity })
        .eq("Id", productId);

      if (error) {
        console.error("Error en update de quantity:", error);
        throw error;
      }

      // Update local state in products array
      setProducts((prev) =>
        prev.map((product) =>
          product.Id === productId
            ? { ...product, quantity: quantity }
            : product,
        ),
      );

      showToast("Cantidad por bulto actualizada", "success");
    } catch (error) {
      console.error("Error actualizando cantidad:", error);
      showToast("Error al actualizar cantidad", "error");
    }
  };

  const abrirModalProducto = (productId = null) => {
    if (productId) {
      // Editar producto existente
      getProductById(productId);
    } else {
      // Crear nuevo producto
      setProduct(null);
      // setProductQuantityPerBundle(1);
    }
    setProductModalOpen(true);
  };

  const cerrarModalProducto = () => {
    setProduct(null);
    // setProductQuantityPerBundle(1);
    setProductModalOpen(false);
  };

  const guardarProducto = async (productoData) => {
    try {
      let imageUrl = null;

      // Si hay un archivo de imagen y estamos editando, procesar la subida
      if (productoData.imageFile && product) {
        try {
          const replacementResult = await processProductImageReplacement(
            productoData.imageFile,
            product,
          );

          if (replacementResult.success) {
            imageUrl = replacementResult.imageUrl;
            // Mostrar notificación de éxito
            showToast(
              `Imagen "${replacementResult.fileName}" subida exitosamente a Supabase Storage`,
              "success",
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
        Stock: productoData.Stock,
        quantity: productoData.quantity || 1,
        oferta_express: productoData.oferta_express || false,
        mas_vendido: productoData.mas_vendido || false,
        solo_bulto: productoData.solo_bulto || false,
      };

      // Lógica para manejar la imagen:
      if (imageUrl) {
        // Si se subió una nueva imagen, usar la nueva URL
        (dataToSave as any).Imagen = imageUrl;
      } else if (product && (product.Imagen || product.imagen)) {
        // Si estamos editando y no se subió nueva imagen, mantener la existente
        (dataToSave as any).Imagen = (product as any).Imagen || (product as any).imagen;
      }
      // Si es un producto nuevo y no se subió imagen, no se incluye el campo Imagen

      // Eliminar campos que no existen o son nulos/vacíos
      if (!dataToSave.Oferta || dataToSave.Oferta.trim() === "")
        delete dataToSave.Oferta;
      // Siempre incluir Stock como booleano (true/false)
      if (dataToSave.Stock === undefined || dataToSave.Stock === null) {
        dataToSave.Stock = false; // Valor por defecto
      }

      if (product) {
        // Actualizar producto existente
        const { error } = await supabaseClient
          .from("productos")
          .update(dataToSave)
          .eq("Id", (product as any).Id);

        if (error) {
          console.error("Error de Supabase:", error);
          throw error;
        }

        // Update quantity per bundle
        await updateProductQuantity((product as any).Id, productoData.quantity || 1);

        showToast("Producto actualizado exitosamente", "success");
      } else {
        // Crear nuevo producto
        // Generar un ID numérico único para el nuevo producto (int8)
        const nuevoId = Date.now(); // Timestamp actual como número entero
        const dataToInsert = {
          ...dataToSave,
          Id: nuevoId,
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
      },
    );
  };

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadShippingPrice();
    loadBankConfig();
    loadCategorias();
  }, [loadShippingPrice, loadBankConfig, loadCategorias]);

  // Cargar productos cuando se cambia a la pestaña de productos
  useEffect(() => {
    if (activeTab === "productos" && products.length === 0) {
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
            showToast(
              `❌ El pedido ya está configurado o tiene otro estado: ${pedido.estado}`,
              "error",
            );
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
      cancelado: "¿Cancelar este pedido? Se notificará al cliente.",
    };

    if (nuevoEstado === "rechazado") {
      // Mostrar modal de rechazo con razón personalizada
      setRejectDialog({
        message: `¿Rechazar este pedido #${idPedido}? Por favor, indica la razón del rechazo.`,
        onConfirm: async (razon) => {
          setRejectDialog(null);
          await procesarCambioEstado(idPedido, nuevoEstado, razon);
        },
      });
    } else {
      // Usar el diálogo normal para otros estados
      showConfirm(
        `${mensajesEstado[nuevoEstado] || `¿Marcar pedido #${idPedido} como ${nuevoEstado.toUpperCase()}?`}`,
        async () => {
          setConfirm(null);
          await procesarCambioEstado(idPedido, nuevoEstado);
        },
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
        fecha_modificacion: new Date().toISOString(),
      };

      // Si se aprueba, iniciar temporizador de pago
      if (nuevoEstado === "aprobado") {
        const fechaVencimiento = new Date(Date.now() + 10 * 60 * 1000);
        (updateData as any).expira_en = fechaVencimiento.toISOString();
        updateData.estado = "configurado";
      }

      const { error } = await supabaseClient
        .from("pedidos")
        .update(updateData)
        .eq("id", idPedido);

      if (error) throw error;

      const estadoFinal =
        nuevoEstado === "aprobado" ? "configurado" : nuevoEstado;
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
    pedidoCopia.carrito = pedidoCopia.carrito.map((item) => ({
      ...item,
      cantidad_original: item.cantidad,
      subtotal: (item.precio_unitario || item.precio || 0) * item.cantidad,
    }));

    setPedidoEditando(pedidoCopia);
    setModalOpen(true);
  };

  const cerrarModalPedido = () => {
    setModalOpen(false);
    setPedidoEditando(null);
    setPriceComparison({ results: [], loading: false, show: false });
  };

  const compareOrderPrices = async () => {
    if (!pedidoEditando || !pedidoEditando.carrito?.length) return;

    setPriceComparison((prev) => ({ ...prev, loading: true, show: true }));

    const items = pedidoEditando.carrito.map((item) => ({
      Id: item.Id || item.id_producto,
      nombre: item.nombre || "Producto",
      precio: Number(item.precio || item.precio_unitario || 0),
      Stock: true,
      Oferta: item.Oferta ? String(item.Oferta) : item.oferta ? String(item.oferta) : undefined,
      cantidad: item.cantidad || 1,
      tipo: item.tipo || "Bulto",
      quantity_per_bundle: item.quantity_per_bundle || 1,
      imagen: item.Imagen || item.imagen,
    }));

    try {
      const result = await validateCartItems(items);
      setPriceComparison({ results: result.changes, loading: false, show: true });
    } catch (err) {
      console.error("Error comparando precios:", err);
      setPriceComparison({ results: [], loading: false, show: true });
      showToast("Error al comparar precios", "error");
    }
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

  const reactivarTemporizador = async (pedidoId) => {
    try {
      const timeMinutes = 15;
      const { error } = await supabaseClient
        .from("pedidos")
        .update({
          estado: "configurado",
          expira_en: new Date(
            Date.now() + timeMinutes * 60 * 1000,
          ).toISOString(),
          horario: `Temporizador reactivado - ${timeMinutes} minutos para pagar`,
        })
        .eq("id", pedidoId);

      if (error) throw error;

      showToast(
        `Temporizador reactivado. El cliente tiene ${timeMinutes} minutos para pagar.`,
      );
      cargarPedidosAdmin();
    } catch (err) {
      showToast("Error reactivando temporizador: " + err.message, "error");
    }
  };

  const guardarModificacionPedido = async () => {
    try {
      const { error: errorOriginal } = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("id", pedidoEditando.id)
        .single();

      if (errorOriginal) throw errorOriginal;

      const carritoParaGuardar = Array.isArray(pedidoEditando.carrito)
        ? pedidoEditando.carrito
        : JSON.parse(pedidoEditando.carrito || "[]");

      // Calcular el total correcto basado en el carrito actualizado
      const subtotal = carritoParaGuardar.reduce((total, item) => {
        const precioUnitario = item.precio_unitario || item.precio || 0;
        return total + precioUnitario * item.cantidad;
      }, 0);

      const envioCosto = pedidoEditando.metodo === "retiro" ? 0 : shippingPrice;
      const mpFee =
        pedidoEditando.metodo_pago === "mercadopago" ? subtotal * 0.08 : 0;
      const totalCalculado = subtotal + mpFee + envioCosto;

      const timeMinutes = 15;
      const { error } = await supabaseClient
        .from("pedidos")
        .update({
          carrito: carritoParaGuardar,
          total: totalCalculado, // Usar el total calculado
          estado: "configurado", // Se comporta como aceptado pero con tiempo configurable
          expira_en: new Date(
            Date.now() + timeMinutes * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", pedidoEditando.id);

      if (error) throw error;

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
      // Obtener detalles del carrito para mensaje personalizado
      let carritoArray = [];
      if (typeof pedido.carrito === "string") {
        try {
          carritoArray = JSON.parse(pedido.carrito);
        } catch {
          carritoArray = [];
        }
      } else if (Array.isArray(pedido.carrito)) {
        carritoArray = pedido.carrito;
      }

      const productosTexto = carritoArray
        .slice(0, 3)
        .map((item) => `*${item.nombre}* x${item.cantidad}`)
        .join("\n");

      const timeMinutes = 15;
      const instruccionesPago =
        pedido.metodo_pago === "mercadopago"
          ? `*Paga con Mercado Pago:* https://yamayorista.online/\n`
          : pedido.metodo_pago === "transferencia"
            ? `*Paga por transferencia bancaria al alias:* ${bancoInfo.alias || "consultar"}\n`
            : `*Pagas en efectivo al ${pedido.metodo === "retiro" ? "retirar" : "recibir"} el pedido*\n`;

      const message =
        `*¡TU PEDIDO ESTÁ LISTO!*\n\n` +
        `*Pedido #${pedido.id}*\n` +
        `*Cliente:* ${pedido.nombre_cliente}\n\n` +
        `*Tus productos:*\n${productosTexto}${carritoArray.length > 3 ? `\n*Y ${carritoArray.length - 3} productos más*` : ""}\n\n` +
        `*Total a pagar:* $${Number(pedido.total).toLocaleString("es-AR")}\n\n` +
        `*Metodo de entrega:* ${pedido.metodo === "retiro" ? "Retiro en sucursal" : "Envío a domicilio"}\n\n` +
        (pedido.metodo_pago !== "efectivo"
          ? `*Tienes ${timeMinutes} minutos para completar el pago*\n`
          : "") +
        instruccionesPago +
        `\n` +
        `*¡Gracias por tu compra!*\n` +
        `*Te mantendremos informado del estado de tu pedido*`;

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
      const mensaje =
        tipo === "rechazado"
          ? `❌ *TU PEDIDO HA SIDO RECHAZADO*\n\n📦 *Pedido #${pedido.id}*\n👤 *Cliente:* ${pedido.nombre_cliente}\n\n⚠️ *Lamentamos informarte que tu pedido no ha sido aprobado.*\n\n📝 *Razón del rechazo:*\n${razon}\n\n❓ *¿Tienes dudas?* Contáctanos para más información.`
          : `❌ *TU PEDIDO HA SIDO CANCELADO*\n\n📦 *Pedido #${pedido.id}*\n👤 *Cliente:* ${pedido.nombre_cliente}\n\n⚠️ *Tu pedido ha sido cancelado.*\n\n${razon ? `📝 *Motivo:*\n${razon}\n\n` : ""}❓ *¿Tienes dudas?* Contáctanos para más información.`;

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
        .map((p) => {
          const subtotal = p.precio * p.cantidad;
          return `• ${p.nombre} x${p.cantidad} = $${subtotal.toLocaleString("es-AR")}`;
        })
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

      <main className="max-w-400 mx-auto px-4 py-8">
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
              onClick={() => setActiveTab("pedidos")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "pedidos"
                  ? "border-[#FF6600] text-[#FF6600]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab("productos")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "productos"
                  ? "border-[#FF6600] text-[#FF6600]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab("configuracion")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "configuracion"
                  ? "border-[#FF6600] text-[#FF6600]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Configuración
            </button>
          </nav>
        </div>

        {/* Contenido de la pestaña activa */}
        {activeTab === "pedidos" && (
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
                    {filtroEstado !== "todos"
                      ? `con estado "${filtroEstado}"`
                      : ""}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                        <th className="p-4 font-black">ID</th>
                        <th className="p-4 font-black">Fecha</th>
                        <th className="p-4 font-black">Monto / Método</th>
                        <th className="p-4 font-black">Estado</th>
                        <th className="p-4 font-black text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {pedidosFiltrados.map((p) => {
                        const fecha = p.created_at.split("T")[0];
                        const tiempoRestante =
                          p.fuente === "web" &&
                          (p.estado === "configurado" ||
                            p.estado === "vencido") &&
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
                              <div className="font-bold text-gray-900">
                                {fecha}
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
                                (p.estado === "configurado" ||
                                  p.estado === "vencido") &&
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
                                        <i className="fas fa-clock mr-1"></i>
                                        Tiempo vencido
                                      </span>
                                    )}
                                  </div>
                                )}
                            </td>
                            <td className="p-4">
                              <div className="font-black text-[#FF6600] text-base">
                                ${Number(p.total).toLocaleString("es-AR")}
                              </div>
                              <div className="text-xs font-bold text-gray-500 mt-0.5">
                                <span className="uppercase">
                                  {p.metodo || "envio"}
                                </span>
                                {p.metodo_pago && (
                                  <span className="ml-2 text-gray-400">
                                    ·{" "}
                                    {p.metodo_pago === "mercadopago"
                                      ? "MP"
                                      : p.metodo_pago}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">{getEstadoBadge(p.estado)}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {p.fuente === "web" &&
                                  p.estado === "pendiente" && (
                                    <button
                                      onClick={() => configurarPedido(p.id)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow text-xs font-black transition flex items-center gap-1"
                                    >
                                      <i className="fas fa-cog"></i> Aceptar
                                    </button>
                                  )}
                                {p.fuente === "web" &&
                                  (p.estado === "configurado" ||
                                    p.estado === "vencido") && (
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
                                {p.fuente === "web" &&
                                  p.estado === "pendiente" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          reactivarTemporizador(p.id)
                                        }
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow text-xs font-bold transition flex items-center gap-1"
                                        title="Reactivar temporizador"
                                      >
                                        <i className="fas fa-clock"></i>{" "}
                                        Reactivar
                                      </button>
                                      <button
                                        onClick={() =>
                                          cambiarEstado(p.id, "rechazado")
                                        }
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow text-xs font-bold transition flex items-center gap-1"
                                        title="Rechazar"
                                      >
                                        <i className="fas fa-times"></i>{" "}
                                        Rechazar
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
        {activeTab === "productos" && (
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
              </div>
            </div>

            {productLoading ? (
              <div className="text-center py-20">
                <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
                <p className="text-lg font-bold text-gray-500">
                  Cargando productos...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <i className="fas fa-box-open text-6xl mb-4"></i>
                <p className="text-lg font-bold">No hay productos</p>
                <p className="text-gray-500 mt-2">
                  Comienza agregando tu primer producto
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="z-2">
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="p-4 font-black">ID</th>
                      <th className="p-4 font-black">Imagen</th>
                      <th className="p-4 font-black">Nombre</th>
                      <th className="p-4 font-black">Categoría</th>
                      <th className="p-4 font-black">Precio</th>
                      <th className="p-4 font-black">Cantidad por bulto</th>
                      <th className="p-4 font-black">Stock</th>
                      <th className="p-4 font-black">Oferta</th>
                      <th className="p-4 font-black">Oferta Express</th>
                      <th className="p-4 font-black">Más Vendido</th>
                      <th className="p-4 font-black">Solo Bulto</th>
                      <th className="p-4 font-black">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      return (
                        <tr
                          key={product.Id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4 font-medium">{product.Id}</td>
                          <td className="p-4">
                            <img
                              src={
                                product.Imagen ||
                                product.imagen ||
                                `https://via.placeholder.com/48/f3f4f6/a1a1aa?text=${product.Id}`
                              }
                              alt={product.nombre}
                              className="w-12 h-12 object-contain rounded-lg"
                              onError={(e) => {
                                console.error(
                                  `Error cargando imagen para producto ${(product as any).Id}`,
                                );
                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/48/f3f4f6/a1a1aa?text=${(product as any).Id}`;
                              }}
                              title={
                                product.Imagen || product.imagen
                                  ? "Imagen de Supabase Storage"
                                  : "Sin imagen"
                              }
                            />
                          </td>
                          <td className="p-4 font-medium">{product.nombre}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-black">
                              {product.Categoria}
                            </span>
                          </td>
                          <td className="p-4 font-black text-green-600">
                            ${product.precio?.toLocaleString("es-AR")}
                          </td>
                          <td>
                            <input
                              className="rounded-xl text-center border border-gray-300 px-2 py-1 w-20"
                              type="number"
                              min="1"
                              value={product.quantity || 1}
                              onChange={(e) =>
                                updateProductQuantity(
                                  product.Id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-black ${
                                product.Stock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.Stock ? "Verdadero" : "Falso"}
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
                            <button
                              onClick={() =>
                                updateProductFlag(
                                  product.Id,
                                  "oferta_express",
                                  !product.oferta_express,
                                )
                              }
                              className={`w-14 h-7 rounded-full transition relative ${
                                product.oferta_express
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                  product.oferta_express
                                    ? "-translate-x-7"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                updateProductFlag(
                                  product.Id,
                                  "mas_vendido",
                                  !product.mas_vendido,
                                )
                              }
                              className={`w-14 h-7 rounded-full transition relative ${
                                product.mas_vendido
                                  ? "bg-yellow-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                  product.mas_vendido
                                    ? "-translate-x-7"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                updateProductFlag(
                                  product.Id,
                                  "solo_bulto",
                                  !product.solo_bulto,
                                )
                              }
                              className={`w-14 h-7 rounded-full transition relative ${
                                product.solo_bulto
                                  ? "bg-yellow-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                  product.solo_bulto
                                    ? "-translate-x-7"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => abrirModalProducto(product.Id)}
                                disabled={loadingProductId === product.Id}
                                className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Editar"
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarProducto(product.Id)}
                                className="bg-red-500 cursor-pointer hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                                title="Eliminar"
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Eliminar
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
        {activeTab === "configuracion" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
                <i className="fas fa-cog text-[#FF6600]"></i>
                Configuración
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="max-w-2xl space-y-8">
                <div>
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
                          ${shippingPrice.toLocaleString("es-AR")}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          (precio vigente)
                        </span>
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
                            onChange={(e) =>
                              setTempShippingPrice(e.target.value)
                            }
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
                          <i className="fas fa-save"></i> Actualizar Precio
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Este cambio afectará todos los pedidos nuevos
                        realizados desde la web
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-building-columns text-[#FF6600]"></i>
                    Datos de Transferencia Bancaria
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Banco
                      </label>
                      <input
                        type="text"
                        value={bancoInfo.banco}
                        onChange={(e) =>
                          setBancoInfo({ ...bancoInfo, banco: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="ej: Banco Nación"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Titular de la cuenta
                      </label>
                      <input
                        type="text"
                        value={bancoInfo.titular}
                        onChange={(e) =>
                          setBancoInfo({
                            ...bancoInfo,
                            titular: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="Nombre y apellido"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Alias
                      </label>
                      <input
                        type="text"
                        value={bancoInfo.alias}
                        onChange={(e) =>
                          setBancoInfo({ ...bancoInfo, alias: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="ej: tienda.mp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        CBU
                      </label>
                      <input
                        type="text"
                        value={bancoInfo.cbu}
                        onChange={(e) =>
                          setBancoInfo({ ...bancoInfo, cbu: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="0000000000000000000000"
                      />
                    </div>
                    <button
                      onClick={saveBankConfig}
                      className="bg-[#FF6600] hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center gap-2"
                    >
                      <i className="fas fa-save"></i> Guardar Datos Bancarios
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Estos datos se mostrarán a los clientes que elijan
                      &lsquo;Transferencia bancaria&lsquo; como método de pago.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-tags text-[#FF6600]"></i>
                    Categorías
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && agregarCategoria()
                        }
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="Nueva categoría..."
                      />
                      <button
                        onClick={agregarCategoria}
                        className="bg-[#FF6600] hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-md flex items-center gap-2"
                      >
                        <i className="fas fa-plus"></i> Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categorias.length === 0 && (
                        <p className="text-sm text-gray-400 font-medium">
                          No hay categorías todavía
                        </p>
                      )}
                      {categorias.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
                        >
                          <span className="text-sm font-bold text-gray-700">
                            {cat.categoria}
                          </span>
                          <button
                            onClick={() =>
                              eliminarCategoria(cat.id, cat.categoria)
                            }
                            className="text-red-400 hover:text-red-600 transition"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
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
                          {!estaEliminado && (
                            <span
                              className={`inline-block ml-2 px-2 py-0.5 rounded text-xs font-black ${
                                (item.tipo || "Bulto") === "Bulto"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.tipo || "Bulto"}
                            </span>
                          )}
                          {estaEliminado && (
                            <span className="text-red-500 ml-1 text-xs">
                              (Eliminado)
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          $
                          {Number(
                            item.precio_unitario || item.precio || 0,
                          ).toLocaleString("es-AR")}{" "}
                          c/u
                          {item.cantidad > 0 && (
                            <span className="ml-2 text-gray-700 font-bold">
                              = $
                              {(
                                Number(
                                  item.precio_unitario || item.precio || 0,
                                ) * item.cantidad
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

            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <button
                onClick={compareOrderPrices}
                disabled={priceComparison.loading}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1 ${
                  priceComparison.show && priceComparison.results.length > 0
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    : priceComparison.show && priceComparison.results.length === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {priceComparison.loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-scale-balanced"></i>
                )}
                {priceComparison.loading
                  ? "Verificando..."
                  : priceComparison.show && priceComparison.results.length > 0
                    ? `${priceComparison.results.length} cambio(s) detectado(s)`
                    : priceComparison.show && priceComparison.results.length === 0
                      ? "Precios actualizados ✓"
                      : "Comparar precios actuales"}
              </button>
            </div>

            {priceComparison.show && priceComparison.results.length > 0 && (
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                <h4 className="font-bold text-yellow-800 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                  <i className="fas fa-triangle-exclamation"></i>
                  Diferencias detectadas con precios actuales
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {priceComparison.results.map((change, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-yellow-200 rounded-lg p-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-800 truncate">
                          {change.nombre}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                          change.tipo === "Bulto"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {change.tipo}
                        </span>
                      </div>
                      {change.cambios.map((c, ci) => (
                        <div key={ci} className="text-gray-600 mt-1 flex items-center gap-1">
                          {c.campo === "precio" && (
                            <>
                              <span className="text-gray-400 line-through">{c.valorViejo}</span>
                              <span className="text-red-600 font-bold">→ {c.valorNuevo}</span>
                            </>
                          )}
                          {c.campo === "stock" && (
                            <span className="text-red-600 font-bold">Sin stock actualmente</span>
                          )}
                          {c.campo === "oferta" && (
                            <>
                              <span className="text-gray-400 line-through">{c.valorViejo}</span>
                              <span className="text-red-600 font-bold">→ {c.valorNuevo}</span>
                            </>
                          )}
                          {c.campo === "existencia" && (
                            <span className="text-red-600 font-bold">Ya no existe en la DB</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Desglose del pedido */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-700 mb-3 text-sm">
                  Desglose del Pedido:
                </h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    // Calcular desglose del pedido
                    let carritoArray = [];
                    if (typeof pedidoEditando.carrito === "string") {
                      try {
                        carritoArray = JSON.parse(pedidoEditando.carrito);
                      } catch {
                        carritoArray = [];
                      }
                    } else if (Array.isArray(pedidoEditando.carrito)) {
                      carritoArray = pedidoEditando.carrito;
                    }

                    const subtotal = carritoArray.reduce((total, item) => {
                      const precioUnitario =
                        item.precio_unitario || item.precio || 0;
                      return total + precioUnitario * item.cantidad;
                    }, 0);

                    const envioCosto =
                      pedidoEditando.metodo === "retiro" ? 0 : shippingPrice;
                    const mpFee =
                      pedidoEditando.metodo_pago === "mercadopago"
                        ? subtotal * 0.08
                        : 0;
                    const totalCalculado = subtotal + mpFee + envioCosto;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Subtotal productos:
                          </span>
                          <span className="font-medium">
                            ${subtotal.toLocaleString("es-AR")}
                          </span>
                        </div>
                        {pedidoEditando.metodo !== "retiro" && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Costo de envío:
                            </span>
                            <span className="font-medium">
                              ${envioCosto.toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                        {mpFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Recargo Mercado Pago (8%):
                            </span>
                            <span className="font-medium">
                              ${mpFee.toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-700">
                              Total:
                            </span>
                            <span className="text-2xl font-black text-[#FF6600]">
                              ${totalCalculado.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                        {pedidoEditando.metodo_pago && (
                          <div className="mt-2 pt-2 border-t text-xs text-gray-500 font-medium">
                            <span className="uppercase">
                              Pago:{" "}
                              {pedidoEditando.metodo_pago === "mercadopago"
                                ? "Mercado Pago"
                                : pedidoEditando.metodo_pago === "transferencia"
                                  ? "Transferencia bancaria"
                                  : "Efectivo"}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
      {productModalOpen && (
        <ProductModal
          key={product?.Id || "new"}
          isOpen={productModalOpen}
          onClose={cerrarModalProducto}
          product={product}
          productId={product?.Id}
          onSave={guardarProducto}
        />
      )}
    </div>
  );
}
