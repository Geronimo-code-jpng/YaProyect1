"use client";

import { useState, createContext, useContext, useEffect, type ReactNode } from "react";
import type { Product } from '../types';

const CART_EXPIRATION = 1000 * 60 * 60;
const STORAGE_KEY = "yaCart";

interface CartItem extends Product {
  cantidad: number;
  tipo: string;
  precio_unitario: number;
  quantity_per_bundle: number;
  oferta?: string;
  descuento?: number;
}

interface CartContextValue {
  cart: CartItem[];
  addToCart: (product: Product & { cantidad?: number; tipo?: string }) => void;
  removeFromCart: (id: number | string, tipo?: string | null) => void;
  updateQuantity: (id: number | string, cantidad: number, tipo?: string | null) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  getCartTotalWithDiscount: (userProfile?: { cantidad_pedidos?: number } | null, shipMethod?: string) => number;
  qualifiesForFirstBuyDiscount: (userProfile?: { cantidad_pedidos?: number } | null, shipMethod?: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Cargar el carrito guardado recién en el cliente (localStorage no existe en SSR)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.expira && Date.now() > parsed.expira) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setCart(parsed.data || []);
        }
      }
    } catch {
      // ignorar carrito corrupto
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload = { data: cart, expira: Date.now() + CART_EXPIRATION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error: unknown) {
      console.error("Error guardando carrito:", error);
      if (error instanceof Error && error.name === "QuotaExceededError") {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [cart, hydrated]);

  const addToCart = (product: Product & { cantidad?: number; tipo?: string }) => {
    if (!product.Id) {
      console.error("Error: El producto no tiene un ID válido", product);
      return;
    }
    setCart((prev) => {
      const productId = String(product.Id);
      const productType = product.tipo || "Bulto";
      const exists = prev.find(
        (item) => String(item.Id) === productId && (item.tipo || "Bulto") === productType
      );
      if (exists) {
        return prev.map((item) =>
          String(item.Id) === productId && (item.tipo || "Bulto") === productType
            ? { ...item, cantidad: item.cantidad + (product.cantidad || 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          Id: Number(productId),
          cantidad: product.cantidad || 1,
          tipo: productType,
          precio_unitario: product.precio_unitario || product.precio,
          quantity_per_bundle: product.quantity_per_bundle || 1,
          oferta: product.Oferta,
          descuento: product.descuento,
        } as CartItem,
      ];
    });
  };

  const removeFromCart = (id: number | string, tipo: string | null = null) => {
    setCart((prev) => {
      if (tipo) {
        return prev.filter(
          (item) => String(item.Id) !== String(id) || (item.tipo || "Bulto") !== tipo
        );
      }
      return prev.filter((item) => String(item.Id) !== String(id));
    });
  };

  const updateQuantity = (id: number | string, cantidad: number, tipo: string | null = null) => {
    if (cantidad < 1) return;
    setCart((prev) =>
      prev.map((item) => {
        const matchesId = String(item.Id) === String(id);
        const matchesType = !tipo || (item.tipo || "Bulto") === tipo;
        return matchesId && matchesType ? { ...item, cantidad } : item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const replaceCart = (items: CartItem[]) => setCart(items);

  const cartTotal = cart.reduce((acc: number, item) => acc + item.precio * item.cantidad, 0);
  const cartCount = cart.reduce((acc: number, item) => acc + item.cantidad, 0);

  const qualifiesForFirstBuyDiscount = (
    userProfile: { cantidad_pedidos?: number } | null | undefined,
    shipMethod?: string
  ) => {
    return !!(userProfile && (userProfile.cantidad_pedidos || 0) === 0 && cartTotal >= 80000 && shipMethod === "envio");
  };

  const getCartTotalWithDiscount = (
    userProfile: { cantidad_pedidos?: number } | null | undefined,
    shipMethod?: string
  ) => {
    if (qualifiesForFirstBuyDiscount(userProfile, shipMethod)) {
      return Math.max(0, cartTotal - 1000);
    }
    return cartTotal;
  };

  return (
    <CartContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateQuantity, clearCart, replaceCart,
        cartTotal, cartCount, isCartOpen, setIsCartOpen,
        getCartTotalWithDiscount, qualifiesForFirstBuyDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
