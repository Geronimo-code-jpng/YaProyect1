import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase as supabaseClient } from "../lib/supabase";

const ProductContext = createContext();

export function useProducts() {
  return useContext(ProductContext);
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Clave para localStorage
  const CACHE_KEY = "ya_mayorista_products_cache";
  const CACHE_TIMESTAMP_KEY = "ya_mayorista_products_timestamp";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

  // Verificar si el cache es válido
  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const now = Date.now();
    const cacheTime = parseInt(timestamp);
    return now - cacheTime < CACHE_DURATION;
  }, []);

  // Obtener productos del cache
  const getProductsFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cached && timestamp && isCacheValid()) {
        const parsed = JSON.parse(cached);
        setLastUpdated(new Date(parseInt(timestamp)));
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("Error leyendo cache de productos:", err);
      // Limpiar cache corrupto
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
  }, [isCacheValid]);

  // Guardar productos en cache
  const saveProductsToCache = useCallback((productsToCache) => {
    try {
      const now = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(productsToCache));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      setLastUpdated(new Date(now));
    } catch (err) {
      console.error("Error guardando cache de productos:", err);
    }
  }, []);

  // Limpiar cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    setLastUpdated(null);
  }, []);

  // Cargar productos (desde cache o base de datos)
  const loadProducts = useCallback(
    async (forceRefresh = false, isAdmin = false) => {
      // Para admin, siempre cargar desde base de datos sin cache
      if (!isAdmin && !forceRefresh) {
        const cachedProducts = getProductsFromCache();
        if (cachedProducts) {
          setProducts(cachedProducts);
          return cachedProducts;
        }
      }

      // Cargar desde base de datos
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabaseClient
          .from("productos")
          .select("*")
          .order("Id", { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setProducts(data);
          // Solo guardar en cache si no es admin
          if (!isAdmin) {
            saveProductsToCache(data);
          }
          return data;
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getProductsFromCache, saveProductsToCache],
  );

  // Inicializar productos al montar el componente
  useEffect(() => {
    const initializeProducts = async () => {
      try {
        // Intentar cargar desde cache primero
        const cachedProducts = getProductsFromCache();
        if (cachedProducts) {
          setProducts(cachedProducts);
        } else {
          // Si no hay cache válido, cargar desde base de datos
          await loadProducts();
        }
      } catch (err) {
        console.error("Error inicializando productos:", err);
        setError(err.message);
      }
    };

    initializeProducts();
  }, [getProductsFromCache, loadProducts]);

  // Refrescar productos manualmente
  const refreshProducts = useCallback(async () => {
    await loadProducts(true); // forceRefresh = true
  }, [loadProducts]);

  // Cargar productos para admin (siempre desde DB sin cache)
  const loadProductsForAdmin = useCallback(async () => {
    return await loadProducts(true, true); // forceRefresh = true, isAdmin = true
  }, [loadProducts]);

  // Obtener producto por ID
  const getProductById = useCallback(
    (id) => {
      return products.find((product) => product.Id === id) || null;
    },
    [products],
  );

  // Filtrar productos por categoría
  const getProductsByCategory = useCallback(
    (category) => {
      if (!category || category === "Todas" || category === "Todas_Filtro") {
        return products;
      }
      return products.filter((product) => product.Categoria === category);
    },
    [products],
  );

  // Buscar productos
  const searchProducts = useCallback(
    (searchTerm) => {
      if (!searchTerm || searchTerm.trim() === "") {
        return products;
      }

      const term = searchTerm.toLowerCase().trim();
      return products.filter(
        (product) =>
          product.nombre?.toLowerCase().includes(term) ||
          product.Categoria?.toLowerCase().includes(term) ||
          product.descripcion?.toLowerCase().includes(term),
      );
    },
    [products],
  );

  // Obtener productos en oferta
  const getProductsOnSale = useCallback(() => {
    return products.filter(
      (product) => product.Oferta && product.Oferta.trim() !== "",
    );
  }, [products]);

  // Obtener categorías únicas
  const getUniqueCategories = useCallback(() => {
    const categories = [
      ...new Set(products.map((product) => product.Categoria).filter(Boolean)),
    ];
    return categories.sort();
  }, [products]);

  // Verificar si el cache está cerca de expirar (para refresh preventivo)
  const isCacheNearExpiry = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const now = Date.now();
    const cacheTime = parseInt(timestamp);
    const timeRemaining = CACHE_DURATION - (now - cacheTime);

    // Si quedan menos de 5 minutos, considerar cerca de expirar
    return timeRemaining < 5 * 60 * 1000;
  }, []);

  // Estado del cache
  const cacheStatus = {
    isValid: isCacheValid(),
    isNearExpiry: isCacheNearExpiry(),
    lastUpdated,
    size: products.length,
  };

  const value = {
    products,
    isLoading,
    error,
    cacheStatus,
    loadProducts,
    refreshProducts,
    loadProductsForAdmin,
    clearCache,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getProductsOnSale,
    getUniqueCategories,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
