"use client";

import { useState, createContext, useContext, useEffect, useCallback, type ReactNode } from "react";
import { fetchProductos } from "../lib/catalogApi";
import type { Product } from '../types';

const CACHE_KEY = "ya_mayorista_products_cache";
const CACHE_TIMESTAMP_KEY = "ya_mayorista_products_timestamp";
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheStatus {
  isValid: boolean;
  isNearExpiry: boolean;
  lastUpdated: Date | null;
  size: number;
}

interface ProductContextValue {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  cacheStatus: CacheStatus;
  loadProducts: (forceRefresh?: boolean, isAdmin?: boolean) => Promise<Product[] | undefined>;
  refreshProducts: () => Promise<void>;
  loadProductsForAdmin: () => Promise<Product[] | undefined>;
  clearCache: () => void;
  getProductById: (id: number) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  searchProducts: (searchTerm: string) => Product[];
  getProductsOnSale: () => Product[];
  getUniqueCategories: () => string[];
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isCacheValid = useCallback(() => {
    if (typeof window === "undefined") return false;
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  }, []);

  const getProductsFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cached && timestamp && isCacheValid()) {
        setLastUpdated(new Date(parseInt(timestamp)));
        return JSON.parse(cached) as Product[];
      }
      return null;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
  }, [isCacheValid]);

  const saveProductsToCache = useCallback((productsToCache: Product[]) => {
    try {
      const now = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(productsToCache));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      setLastUpdated(new Date(now));
    } catch (err) {
      console.error("Error guardando cache:", err);
    }
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    setLastUpdated(null);
  }, []);

  const loadProducts = useCallback(async (forceRefresh = false, isAdmin = false) => {
    if (!isAdmin && !forceRefresh) {
      const cachedProducts = getProductsFromCache();
      if (cachedProducts) {
        setProducts(cachedProducts);
        return cachedProducts;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProductos();
      data.sort((a, b) => {
        if (a.Stock !== b.Stock) return a.Stock ? -1 : 1;
        return (a.nombre || "").localeCompare(b.nombre || "");
      });

      if (data) {
        setProducts(data as Product[]);
        if (!isAdmin) saveProductsToCache(data as Product[]);
        return data as Product[];
      }
    } catch (err: unknown) {
      console.error("Error cargando productos:", err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getProductsFromCache, saveProductsToCache]);

  useEffect(() => {
    const initializeProducts = async () => {
      try {
        const cachedProducts = getProductsFromCache();
        if (cachedProducts) {
          setProducts(cachedProducts);
        } else {
          await loadProducts();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    };
    initializeProducts();
  }, [getProductsFromCache, loadProducts]);

  const refreshProducts = useCallback(async () => { await loadProducts(true); }, [loadProducts]);
  const loadProductsForAdmin = useCallback(async () => { return await loadProducts(true, true); }, [loadProducts]);

  const getProductById = useCallback((id: number) => {
    return products.find((product) => product.Id === id) || null;
  }, [products]);

  const getProductsByCategory = useCallback((category: string) => {
    if (!category || category === "Todas" || category === "Todas_Filtro") return products;
    return products.filter((product) => product.Categoria === category);
  }, [products]);

  const searchProducts = useCallback((searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === "") return products;
    const term = searchTerm.toLowerCase().trim();
    return products.filter(
      (product) =>
        product.nombre?.toLowerCase().includes(term) ||
        product.Categoria?.toLowerCase().includes(term) ||
        product.descripcion?.toLowerCase().includes(term)
    );
  }, [products]);

  const getProductsOnSale = useCallback(() => {
    return products.filter((product) => product.Oferta && product.Oferta.trim() !== "");
  }, [products]);

  const getUniqueCategories = useCallback(() => {
    return [...new Set(products.map((product) => product.Categoria).filter(Boolean))].sort();
  }, [products]);

  const isCacheNearExpiry = useCallback(() => {
    if (typeof window === "undefined") return true;
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;
    return CACHE_DURATION - (Date.now() - parseInt(timestamp)) < 5 * 60 * 1000;
  }, []);

  const cacheStatus: CacheStatus = {
    isValid: isCacheValid(),
    isNearExpiry: isCacheNearExpiry(),
    lastUpdated,
    size: products.length,
  };

  return (
    <ProductContext.Provider value={{
      products, isLoading, error, cacheStatus,
      loadProducts, refreshProducts, loadProductsForAdmin, clearCache,
      getProductById, getProductsByCategory, searchProducts,
      getProductsOnSale, getUniqueCategories,
    }}>
      {children}
    </ProductContext.Provider>
  );
}
